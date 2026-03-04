function dbToPercent(db) {
  return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
}

function getColor(db) {
  if (db > -10) return '#ef4444';
  if (db > -20) return '#eab308';
  return '#22c55e';
}

export default function AudioMeter({ label, level }) {
  const pct = dbToPercent(level ?? -100);
  const color = getColor(level ?? -100);
  const dbText = level !== undefined && level > -100 ? `${level.toFixed(1)} dB` : '---';

  return (
    <div className="audio-meter">
      <div className="meter-label">
        <span>{label}</span>
        <span className="meter-db">{dbText}</span>
      </div>
      <div className="meter-track">
        <div
          className="meter-fill"
          style={{ width: `${pct}%`, background: color, transition: 'width 50ms linear' }}
        />
      </div>
    </div>
  );
}
