"use client";

import { useCallback, useMemo } from 'react';
import { Section } from '../../../components/Section';
import { StatCard } from '../../../components/StatCard';
import { Table } from '../../../components/Table';
import {
  fetchActiveSessions,
  fetchDashboardStats,
  fetchDevices,
  fetchSessionHistory,
} from '../../../lib/api';
import { parseDateTime } from '../../../lib/dateTime';
import {
  activeSessions,
  dashboardStats,
  devices,
  sessionHistory,
} from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function DashboardPage() {
  const load = useCallback(() => fetchDashboardStats(), []);
  const { data } = useAdminData(load, dashboardStats);
  const { data: deviceData } = useAdminData(
    useCallback(() => fetchDevices(), []),
    devices,
  );
  const { data: activeData } = useAdminData(
    useCallback(() => fetchActiveSessions(), []),
    activeSessions,
  );
  const { data: historyData } = useAdminData(
    useCallback(() => fetchSessionHistory(), []),
    sessionHistory,
  );

  const stats = useMemo(() => {
    const online = deviceData.filter((item) => item.status.toLowerCase() === 'online').length;
    const offline = deviceData.filter((item) => item.status.toLowerCase() !== 'online').length;
    const charging = activeData.length;
    const alerts = data.criticalAlerts;
    return { online, offline, charging, alerts };
  }, [deviceData, activeData, data.criticalAlerts]);

  const donutBackground = useMemo(() => {
    const total = Math.max(1, stats.online + stats.charging + stats.offline + stats.alerts);
    const onlineDeg = (stats.online / total) * 360;
    const chargingDeg = (stats.charging / total) * 360;
    const offlineDeg = (stats.offline / total) * 360;
    const onlineEnd = onlineDeg;
    const chargingEnd = onlineEnd + chargingDeg;
    const offlineEnd = chargingEnd + offlineDeg;

    return `conic-gradient(
      var(--accent) 0deg ${onlineEnd}deg,
      #cbd5f5 ${onlineEnd}deg ${chargingEnd}deg,
      #94a3b8 ${chargingEnd}deg ${offlineEnd}deg,
      var(--warn) ${offlineEnd}deg 360deg
    )`;
  }, [stats]);

  const recentSessions = useMemo(() => {
    return [...activeData, ...historyData].slice(0, 6);
  }, [activeData, historyData]);

  const chartSeries = useMemo(() => {
    const values = historyData.map((item) => item.cost);
    const recent = values.slice(-12);
    const max = Math.max(1, ...recent);
    return recent.map((value) => Math.round((value / max) * 100));
  }, [historyData]);

  const chartLabels = useMemo(() => {
    const recent = historyData.slice(-12);
    if (recent.length === 0) {
      return Array.from({ length: 12 }).map((_, idx) => `M${idx + 1}`);
    }
    const parsed = recent.map((session) =>
      parseDateTime(session.startedAt ?? session.startTime),
    );
    if (parsed.every((date) => date)) {
      return parsed.map((date) => date!.toLocaleString('en-IN', { month: 'short' }));
    }

    const now = new Date();
    return Array.from({ length: 12 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
      return date.toLocaleString('en-IN', { month: 'short' });
    });
  }, [historyData]);

  return (
    <>
      <Section title="System Health" subtitle="Live KPIs for the EV network">
        <div className="stat-grid">
          <StatCard label="Total Vendors" value={data.vendors} />
          <StatCard label="Total Stations" value={data.stations} />
          <StatCard label="Total Devices" value={data.devices} />
          <StatCard label="Online Devices" value={data.devicesOnline} />
          <StatCard label="Active Sessions" value={data.activeSessions} />
          <StatCard label="Energy Today (kWh)" value={data.energyToday} />
          <StatCard label="Revenue Today (INR)" value={data.revenueToday} />
          <StatCard label="Platform Earnings (INR)" value={data.platformEarnings} />
          <StatCard label="Critical Alerts" value={data.criticalAlerts} />
        </div>
      </Section>

      <div className="dash-row">
        <section className="panel" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div className="section-head">
            <div>
              <h3>Charger Status</h3>
              <p className="section-subtitle">Fleet health and alerts</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="donut" aria-hidden="true" style={{ ['--donut-bg' as string]: donutBackground }} />
            <div className="legend">
              <div className="legend-item">
                <span><span className="legend-dot" style={{ background: 'var(--accent)' }} /> Online</span>
                <strong>{stats.online}</strong>
              </div>
              <div className="legend-item">
                <span><span className="legend-dot" style={{ background: '#cbd5f5' }} /> Charging</span>
                <strong>{stats.charging}</strong>
              </div>
              <div className="legend-item">
                <span><span className="legend-dot" style={{ background: '#94a3b8' }} /> Offline</span>
                <strong>{stats.offline}</strong>
              </div>
              <div className="legend-item">
                <span><span className="legend-dot" style={{ background: 'var(--warn)' }} /> Alerts</span>
                <strong>{stats.alerts}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div className="section-head">
            <div>
              <h3>Fees Collected</h3>
              <p className="section-subtitle">Monthly revenue trend</p>
            </div>
            <div style={{ fontWeight: 600 }}>INR {data.revenueToday.toLocaleString('en-IN')}</div>
          </div>
          <div className="mini-chart-wrap">
            <div className="mini-chart">
              {chartSeries.map((value, idx) => (
                <div
                  key={idx}
                  className={`mini-bar${idx % 3 === 0 ? ' muted' : ''}`}
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
            <div className="mini-labels">
              {chartLabels.map((label, idx) => (
                <span key={idx} style={{ textAlign: 'center' }}>{label}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Section title="Recent Sessions" subtitle="Latest charging activity">
        <Table
          headings={["Session", "Device", "User", "Energy", "Cost", "Status"]}
          rows={recentSessions.map((session) => [
            session.id,
            session.deviceId,
            session.user,
            `${session.energyKwh} kWh`,
            `INR ${session.cost}`,
            session.status,
          ])}
        />
      </Section>
    </>
  );
}
