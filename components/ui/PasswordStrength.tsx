interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const calculateStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    const finalStrength = Math.min(strength, 100);
    
    let label = '';
    let color = '';
    
    if (finalStrength < 40) {
      label = 'სუსტი';
      color = 'bg-red-500';
    } else if (finalStrength < 70) {
      label = 'საშუალო';
      color = 'bg-yellow-500';
    } else {
      label = 'ძლიერი';
      color = 'bg-green-500';
    }
    
    return { strength: finalStrength, label, color };
  };

  const { strength, label, color } = calculateStrength();

  if (!password) return null;

  return (
    <div className="space-y-2 animate-fadeIn">
      <div className="flex justify-between text-xs">
        <span className="text-foreground/60">პაროლის სიძლიერე</span>
        <span className={`font-medium ${
          strength < 40 ? 'text-red-500' :
          strength < 70 ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {label}
        </span>
      </div>
      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${strength}%` }}
        />
      </div>
      
      {/* Requirements checklist */}
      <div className="mt-3 space-y-1 text-xs">
        <RequirementItem met={password.length >= 8} text="მინიმუმ 8 სიმბოლო" />
        <RequirementItem met={/[A-Z]/.test(password)} text="მინიმუმ 1 დიდი ასო" />
        <RequirementItem met={/[a-z]/.test(password)} text="მინიმუმ 1 პატარა ასო" />
        <RequirementItem met={/[0-9]/.test(password)} text="მინიმუმ 1 ციფრი" />
        <RequirementItem met={/[^A-Za-z0-9]/.test(password)} text="მინიმუმ 1 სპეციალური სიმბოლო" />
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 transition-colors ${met ? 'text-green-600' : 'text-foreground/40'}`}>
      {met ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <span>{text}</span>
    </div>
  );
}
