interface Props {
  percentage: number;
  label: string;
  onClick?: () => void;
}

export function ProgressCard({ percentage, label, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: 'var(--surface-color)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
           e.currentTarget.style.transform = 'translateY(-4px)';
           e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
           e.currentTarget.style.transform = 'none';
           e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: `conic-gradient(var(--success-color) ${percentage}%, var(--border-color) 0)`,
        display: 'grid',
        placeItems: 'center',
        marginBottom: '1rem',
        transition: 'background 0.5s ease-out'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'var(--surface-color)',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: percentage === 100 ? 'var(--success-color)' : 'var(--primary-color)',
          transition: 'color 0.2s'
        }}>
          {percentage}%
        </div>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{label}</h3>
    </div>
  );
}
