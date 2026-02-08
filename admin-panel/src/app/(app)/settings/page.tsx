'use client';

import { useEffect, useState } from 'react';
import { Section } from '../../../components/Section';
import { Field } from '../../../components/Field';
import { Button } from '../../../components/Button';
import { fetchSettings, updateSettings } from '../../../lib/api';

export default function SettingsPage() {
  const [margin, setMargin] = useState(20);
  const [carMin, setCarMin] = useState(700);
  const [bikeMin, setBikeMin] = useState(300);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchSettings()
      .then((settings) => {
        if (!active) {
          return;
        }
        setMargin(settings.platformFeePct);
        setCarMin(settings.minWalletCar);
        setBikeMin(settings.minWalletBike);
        setBookingEnabled(settings.bookingsEnabled);
      })
      .catch((err) => {
        if (active) {
          setError((err as Error).message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettings({
        platformFeePct: margin,
        minWalletCar: carMin,
        minWalletBike: bikeMin,
      });
      setMargin(updated.platformFeePct);
      setCarMin(updated.minWalletCar);
      setBikeMin(updated.minWalletBike);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleBookingToggle = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettings({
        bookingsEnabled: bookingEnabled,
      });
      setBookingEnabled(updated.bookingsEnabled);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Platform Settings" subtitle="Business rules and thresholds">
      <div className="grid-2">
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <Field label="Platform margin (%)">
            <input value={margin} onChange={(e) => setMargin(Number(e.target.value))} type="number" />
          </Field>
          <Field label="Minimum wallet (Car)">
            <input value={carMin} onChange={(e) => setCarMin(Number(e.target.value))} type="number" />
          </Field>
          <Field label="Minimum wallet (Bike)">
            <input value={bikeMin} onChange={(e) => setBikeMin(Number(e.target.value))} type="number" />
          </Field>
          <Button onClick={handleSaveSettings} disabled={loading || saving}>Save Settings</Button>
        </div>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <h4 style={{ marginTop: 0 }}>Booking Controls</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              checked={bookingEnabled}
              onChange={(e) => setBookingEnabled(e.target.checked)}
            />
            Enable bookings platform-wide
          </label>
          <Button variant="ghost" onClick={handleBookingToggle} disabled={loading || saving}>Apply</Button>
          {error ? <p style={{ color: 'var(--bad)', marginTop: 4 }}>{error}</p> : null}
        </div>
      </div>
    </Section>
  );
}
