"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator, ChevronDown, ChevronUp, X } from "lucide-react";

function factorial(n: number) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function FloatingScientificCalc() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expr, setExpr] = useState("");
  const [out, setOut] = useState("0");
  const [deg, setDeg] = useState(true);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [pos, setPos] = useState({ x: 16, y: 96 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      setPos({
        x: Math.max(8, drag.current.px + e.clientX - drag.current.x),
        y: Math.max(8, drag.current.py + e.clientY - drag.current.y),
      });
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function append(token: string) {
    setExpr((e) => e + token);
  }

  function evaluate() {
    try {
      const src = expr
        .replace(/π/g, "Math.PI")
        .replace(/\be\b/g, "Math.E")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/sin\(/g, deg ? "Math.sin(Math.PI/180*" : "Math.sin(")
        .replace(/cos\(/g, deg ? "Math.cos(Math.PI/180*" : "Math.cos(")
        .replace(/tan\(/g, deg ? "Math.tan(Math.PI/180*" : "Math.tan(")
        .replace(/(\d+)!/g, (_, n) => `factorial(${n})`);

      // eslint-disable-next-line no-new-func
      const value = Function("factorial", `"use strict"; return (${src});`)(factorial);
      if (typeof value !== "number" || Number.isNaN(value)) throw new Error("NaN");
      setOut(String(Number(value.toPrecision(12))));
    } catch {
      setOut("Error");
    }
  }

  const keys = [
    "7", "8", "9", "/", "sin(",
    "4", "5", "6", "*", "cos(",
    "1", "2", "3", "-", "tan(",
    "0", ".", "(", ")", "+",
    "π", "e", "√(", "log(", "ln(",
    "^", "!", "AC", "⌫", "=",
  ];

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="dl-calc-fab"
          onClick={() => setOpen(true)}
          aria-label="Open scientific calculator"
        >
          <Calculator size={20} />
          <span>Calc</span>
        </button>
      ) : (
        <aside
          className={`dl-calc ${collapsed ? "collapsed" : ""}`}
          style={{ left: pos.x, top: pos.y }}
          aria-label="Floating scientific calculator"
        >
          <header
            className="dl-calc-drag"
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
            }}
          >
            <span>Scientific calc</span>
            <div className="dl-calc-actions">
              <button type="button" onClick={() => setDeg((d) => !d)} aria-label="Toggle deg/rad">
                {deg ? "DEG" : "RAD"}
              </button>
              <button type="button" onClick={() => setCollapsed((c) => !c)} aria-label="Collapse">
                {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
          </header>
          {!collapsed ? (
            <>
              <div className="dl-calc-screen">
                <div className="expr">{expr || "0"}</div>
                <div className="out">{out}</div>
              </div>
              <div className="dl-calc-keys">
                {keys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === "AC") {
                        setExpr("");
                        setOut("0");
                        return;
                      }
                      if (k === "⌫") {
                        setExpr((e) => e.slice(0, -1));
                        return;
                      }
                      if (k === "=") {
                        evaluate();
                        return;
                      }
                      if (k === "^") {
                        append("**");
                        return;
                      }
                      append(k);
                    }}
                  >
                    {k === "*" ? "×" : k === "/" ? "÷" : k}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </aside>
      )}
    </>
  );
}
