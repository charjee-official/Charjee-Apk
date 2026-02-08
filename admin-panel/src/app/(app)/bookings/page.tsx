"use client";

import { useCallback } from 'react';
import { Section } from '../../../components/Section';
import { Table } from '../../../components/Table';
import { StatusPill } from '../../../components/StatusPill';
import { fetchBookings } from '../../../lib/api';
import { formatDateTimeValue } from '../../../lib/dateTime';
import { bookings } from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function BookingsPage() {
  const load = useCallback(() => fetchBookings(), []);
  const { data } = useAdminData(load, bookings);

  return (
    <Section title="Bookings" subtitle="Upcoming and past reservations">
      <Table
        headings={["Booking", "Device", "User", "Start", "End", "Status"]}
        rows={data.map((booking) => [
          booking.id,
          booking.deviceId,
          booking.user,
          formatDateTimeValue(booking.startAt),
          formatDateTimeValue(booking.endAt),
          <StatusPill key={`${booking.id}-status`} value={booking.status} />,
        ])}
      />
    </Section>
  );
}
