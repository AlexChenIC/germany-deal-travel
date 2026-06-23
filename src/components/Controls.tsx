import type { ReactElement, ReactNode } from "react";

export function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: ReactElement;
}) {
  return (
    <div className="metric">
      {icon}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button className={active ? "tab is-active" : "tab"} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function SelectField({
  icon,
  value,
  options,
  onChange,
}: {
  icon: ReactElement;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-field">
      {icon}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
