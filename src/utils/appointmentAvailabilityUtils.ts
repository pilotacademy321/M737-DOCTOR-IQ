import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DoctorScheduleConfig, AppointmentRecord } from '../types/database';
import { cleanFirestoreData } from './firestoreUtils';

export interface DoctorDailyAvailability {
  date: string;
  confirmedSlots: string[];
  pendingSlots: string[];
  totalBookings: number;
  dailyCapacity?: number;
  updatedAt: string;
}

/**
 * Subscribes to real-time slot availability for a specific doctor on a specific date.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeDoctorAvailability(
  doctorId: string,
  date: string,
  onUpdate: (availability: DoctorDailyAvailability | null) => void,
  onError?: (err: Error) => void
): () => void {
  if (!doctorId || !date) {
    onUpdate(null);
    return () => {};
  }

  const docRef = doc(db, 'doctor_schedules', doctorId, 'availability', date);
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DoctorDailyAvailability;
        onUpdate({
          date,
          confirmedSlots: Array.isArray(data.confirmedSlots) ? data.confirmedSlots : [],
          pendingSlots: Array.isArray(data.pendingSlots) ? data.pendingSlots : [],
          totalBookings: typeof data.totalBookings === 'number' ? data.totalBookings : (data.confirmedSlots?.length || 0) + (data.pendingSlots?.length || 0),
          dailyCapacity: data.dailyCapacity,
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Real-time availability subscription notice:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Generates all candidate time slots between shiftStartTime and shiftEndTime
 */
export function generateShiftSlots(
  startTime: string = '09:00',
  endTime: string = '15:00',
  durationMinutes: number = 20
): string[] {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const slots: string[] = [];
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    slots.push(`${displayH}:${displayM} ${ampm}`);
    currentMinutes += durationMinutes;
  }

  return slots;
}

/**
 * Computes slot status grid (available, pending, confirmed) combining schedule config,
 * real-time availability doc, and any doctor-loaded appointments.
 */
export function computeSlotAvailabilityGrid(
  scheduleConfig: DoctorScheduleConfig | null,
  availability: DoctorDailyAvailability | null,
  fallbackAppointments?: AppointmentRecord[]
): {
  allSlotsWithStatus: Array<{ slot: string; status: 'available' | 'pending' | 'confirmed' }>;
  availableSlots: string[];
  capacityStats: { dailyCap: number; confirmedCount: number; pendingCount: number; remainingAvailable: number };
} {
  const startTime = scheduleConfig?.shiftStartTime || '09:00';
  const endTime = scheduleConfig?.shiftEndTime || '15:00';
  const duration = scheduleConfig?.slotDurationMinutes || 20;
  const dailyCap = scheduleConfig?.dailyCapacity || 15;

  const candidateSlots = generateShiftSlots(startTime, endTime, duration);

  const confirmedSet = new Set<string>(availability?.confirmedSlots || []);
  const pendingSet = new Set<string>(availability?.pendingSlots || []);

  // Merge any loaded appointments (e.g. from doctor view or fallback)
  if (fallbackAppointments && fallbackAppointments.length > 0) {
    fallbackAppointments.forEach((app) => {
      if (app.status === 'confirmed') {
        confirmedSet.add(app.timeSlot);
      } else if (app.status === 'pending') {
        pendingSet.add(app.timeSlot);
      }
    });
  }

  const allSlotsWithStatus = candidateSlots.map((slot) => {
    if (confirmedSet.has(slot)) {
      return { slot, status: 'confirmed' as const };
    }
    if (pendingSet.has(slot)) {
      return { slot, status: 'pending' as const };
    }
    return { slot, status: 'available' as const };
  });

  const availableSlots = allSlotsWithStatus.filter((s) => s.status === 'available').map((s) => s.slot);
  const confirmedCount = confirmedSet.size;
  const pendingCount = pendingSet.size;
  const totalActive = confirmedCount + pendingCount;
  const remainingAvailable = Math.max(0, dailyCap - totalActive);

  return {
    allSlotsWithStatus,
    availableSlots,
    capacityStats: {
      dailyCap,
      confirmedCount,
      pendingCount,
      remainingAvailable,
    },
  };
}

/**
 * Atomic reservation of slot inside runTransaction
 */
export async function reserveSlotInTransaction(
  transaction: Transaction,
  doctorId: string,
  date: string,
  timeSlot: string,
  dailyCapacity: number
): Promise<void> {
  const availRef = doc(db, 'doctor_schedules', doctorId, 'availability', date);
  const snap = await transaction.get(availRef);

  let confirmedSlots: string[] = [];
  let pendingSlots: string[] = [];
  let totalBookings = 0;

  if (snap.exists()) {
    const data = snap.data() as DoctorDailyAvailability;
    confirmedSlots = Array.isArray(data.confirmedSlots) ? data.confirmedSlots : [];
    pendingSlots = Array.isArray(data.pendingSlots) ? data.pendingSlots : [];
    totalBookings = typeof data.totalBookings === 'number' ? data.totalBookings : confirmedSlots.length + pendingSlots.length;
  }

  // Check if slot already taken
  if (confirmedSlots.includes(timeSlot) || pendingSlots.includes(timeSlot)) {
    throw new Error('عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.');
  }

  // Check if daily capacity reached
  if (totalBookings >= dailyCapacity) {
    throw new Error('عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.');
  }

  // Atomically update availability document
  const updatedPending = [...pendingSlots, timeSlot];
  transaction.set(
    availRef,
    cleanFirestoreData({
      date,
      confirmedSlots,
      pendingSlots: updatedPending,
      totalBookings: totalBookings + 1,
      dailyCapacity,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true }
  );
}

/**
 * Updates slot availability when appointment is confirmed, cancelled, rejected, or added as walk-in
 */
export async function updateSlotOnAppointmentStatusChange(
  doctorId: string,
  date: string,
  timeSlot: string,
  action: 'confirm' | 'cancel' | 'reject' | 'add_confirmed'
): Promise<void> {
  if (!doctorId || !date || !timeSlot) return;
  try {
    const availRef = doc(db, 'doctor_schedules', doctorId, 'availability', date);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(availRef);
      let confirmedSlots: string[] = [];
      let pendingSlots: string[] = [];
      let totalBookings = 0;
      let dailyCapacity = 15;

      if (snap.exists()) {
        const data = snap.data() as DoctorDailyAvailability;
        confirmedSlots = Array.isArray(data.confirmedSlots) ? [...data.confirmedSlots] : [];
        pendingSlots = Array.isArray(data.pendingSlots) ? [...data.pendingSlots] : [];
        totalBookings = typeof data.totalBookings === 'number' ? data.totalBookings : confirmedSlots.length + pendingSlots.length;
        if (data.dailyCapacity) dailyCapacity = data.dailyCapacity;
      }

      if (action === 'confirm') {
        pendingSlots = pendingSlots.filter((s) => s !== timeSlot);
        if (!confirmedSlots.includes(timeSlot)) {
          confirmedSlots.push(timeSlot);
        }
        totalBookings = confirmedSlots.length + pendingSlots.length;
      } else if (action === 'cancel' || action === 'reject') {
        pendingSlots = pendingSlots.filter((s) => s !== timeSlot);
        confirmedSlots = confirmedSlots.filter((s) => s !== timeSlot);
        totalBookings = Math.max(0, confirmedSlots.length + pendingSlots.length);
      } else if (action === 'add_confirmed') {
        pendingSlots = pendingSlots.filter((s) => s !== timeSlot);
        if (!confirmedSlots.includes(timeSlot)) {
          confirmedSlots.push(timeSlot);
        }
        totalBookings = confirmedSlots.length + pendingSlots.length;
      }

      transaction.set(
        availRef,
        cleanFirestoreData({
          date,
          confirmedSlots,
          pendingSlots,
          totalBookings,
          dailyCapacity,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    });
  } catch (err) {
    console.warn('Could not update slot availability:', err);
  }
}

/**
 * Reconciles availability document with authoritative appointment records
 */
export async function syncDoctorAvailabilityFromAppointments(
  doctorId: string,
  date: string,
  appointments: AppointmentRecord[],
  dailyCapacity: number = 15
): Promise<void> {
  if (!doctorId || !date) return;
  try {
    const targetApps = appointments.filter((a) => a.date === date);
    const confirmedSlots = Array.from(new Set(
      targetApps.filter((a) => a.status === 'confirmed').map((a) => a.timeSlot).filter(Boolean)
    ));
    const pendingSlots = Array.from(new Set(
      targetApps.filter((a) => a.status === 'pending').map((a) => a.timeSlot).filter(Boolean)
    ));
    const totalBookings = confirmedSlots.length + pendingSlots.length;

    const availRef = doc(db, 'doctor_schedules', doctorId, 'availability', date);
    await setDoc(
      availRef,
      cleanFirestoreData({
        date,
        confirmedSlots,
        pendingSlots,
        totalBookings,
        dailyCapacity,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync availability document:', err);
  }
}
