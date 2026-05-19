import { Battery, BatteryCharging, Briefcase, Fuel, Gauge, PlugZap, Route, Timer, Users, Zap } from "lucide-react";
import type { ReactNode } from "react";
import type { ModelEngineOption } from "@/lib/types";

type ColKey =
  | "range_km"
  | "battery_kwh"
  | "power_hp"
  | "acceleration_s"
  | "trunk_l"
  | "seats"
  | "consumption_text"
  | "charging_ac_kw"
  | "charging_dc_kw"
  | "charging_text";

type ColDef = {
  key: ColKey;
  label: string;
  unit: string;
  icon: ReactNode;
};

const ALL_COLS: ColDef[] = [
  { key: "range_km", label: "Hatótáv", unit: "km", icon: <Route size={13} /> },
  { key: "battery_kwh", label: "Akku", unit: "kWh", icon: <Battery size={13} /> },
  { key: "power_hp", label: "Teljesítmény", unit: "LE", icon: <Gauge size={13} /> },
  { key: "acceleration_s", label: "0–100", unit: "s", icon: <Timer size={13} /> },
  { key: "trunk_l", label: "Csomagtartó", unit: "l", icon: <Briefcase size={13} /> },
  { key: "seats", label: "Ülések", unit: "fő", icon: <Users size={13} /> },
  { key: "consumption_text", label: "Fogyasztás", unit: "", icon: <Fuel size={13} /> },
  { key: "charging_ac_kw", label: "AC töltés", unit: "kW", icon: <PlugZap size={13} /> },
  { key: "charging_dc_kw", label: "DC töltés", unit: "kW", icon: <BatteryCharging size={13} /> },
  { key: "charging_text", label: "Töltés infó", unit: "", icon: <Zap size={13} /> },
];

function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

/**
 * Designed table-like layout listing the model's engine variants and their
 * differing parameters. Columns are auto-hidden when no variant has data.
 */
export function VariantsTable({ options }: { options: ModelEngineOption[] }) {
  if (options.length === 0) return null;

  const cols = ALL_COLS.filter((c) =>
    options.some((o) => hasValue(o[c.key])),
  );

  return (
    <div
      className="variants-table"
      role="table"
      aria-label="Modellváltozatok"
      style={{ ["--vt-cols" as string]: cols.length }}
    >
      <div className="vt-head" role="row">
        <div className="vt-cell vt-name" role="columnheader">
          Változat
        </div>
        {cols.map((c) => (
          <div key={c.key} className="vt-cell vt-col" role="columnheader">
            <span className="vt-col-icon">{c.icon}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      {options.map((o) => (
        <div key={o.id} className="vt-row" role="row">
          <div className="vt-cell vt-name" role="cell">
            {o.name || "Base"}
          </div>
          {cols.map((c) => {
            const val = o[c.key];
            return (
              <div key={c.key} className="vt-cell" role="cell">
                {hasValue(val) ? (
                  <>
                    <span className="vt-v">{String(val)}</span>
                    {c.unit ? <small>{c.unit}</small> : null}
                  </>
                ) : (
                  <span className="vt-empty">—</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
