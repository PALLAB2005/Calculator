(function () {
  var OPS = "+−×÷";
  var expr = "", done = false, lastExpr = "", resultText = "", notice = "";
  var exprEl = document.getElementById("expr");
  var resEl = document.getElementById("result");

  function isOp(c) { return OPS.indexOf(c) !== -1; }
  function lastNum() { var m = expr.match(/(\d+\.?\d*|\.\d+)$/); return m ? m[0] : ""; }
  function stripTrail(s) { while (s && isOp(s.slice(-1))) s = s.slice(0, -1); return s; }
  function fmt(n) {
    var a = Math.abs(n);
    if (a !== 0 && (a >= 1e15 || a < 1e-9)) return n.toExponential(6).replace("-", "−");
    return String(parseFloat(n.toPrecision(12))).replace("-", "−");
  }

  // Recursive-descent evaluator: respects × ÷ before + −, no eval().
  function evaluate(s) {
    var t = s.match(/\d+\.?\d*|\.\d+|[+−×÷]/g) || [], i = 0;
    function factor() {
      if (t[i] === "−") { i++; return -factor(); }
      var v = parseFloat(t[i++]);
      if (isNaN(v)) throw new Error("syntax");
      return v;
    }
    function term() {
      var v = factor();
      while (t[i] === "×" || t[i] === "÷") {
        var o = t[i++], r = factor();
        if (o === "×") v *= r;
        else { if (r === 0) throw new Error("div0"); v /= r; }
      }
      return v;
    }
    function sum() {
      var v = term();
      while (t[i] === "+" || t[i] === "−") {
        var o = t[i++], r = term();
        v = o === "+" ? v + r : v - r;
      }
      return v;
    }
    var v = sum();
    if (i < t.length || !isFinite(v)) throw new Error("syntax");
    return v;
  }

  function preview() {
    var s = stripTrail(expr);
    if (!/[+−×÷]/.test(s.slice(1))) return null;
    try { return fmt(evaluate(s)); } catch (e) { return null; }
  }

  function render() {
    var top, main;
    if (notice) { top = expr; main = notice; }
    else if (done) { top = lastExpr + " ="; main = expr || resultText; }
    else {
      top = expr;
      var p = preview();
      main = p !== null ? p : (stripTrail(expr) || "0");
    }
    exprEl.textContent = top.replace(/([+−×÷])/g, " $1 ").trim();
    resEl.textContent = main;
    var n = main.length;
    resEl.style.fontSize = n <= 9 ? "2.6rem" : n <= 12 ? "2rem" : n <= 16 ? "1.5rem" : "1.2rem";
  }

  function digit(k) {
    if (done) { expr = ""; done = false; }
    var n = lastNum();
    if (n.replace(".", "").length >= 15) return;
    if (n === "0") expr = expr.slice(0, -1) + k; else expr += k;
  }
  function dot() {
    if (done) { expr = ""; done = false; }
    var n = lastNum();
    if (n.indexOf(".") !== -1) return;
    expr += n ? "." : "0.";
  }
  function op(k) {
    if (done && !expr) return;
    done = false;
    if (!expr) { if (k === "−") expr = "−"; return; }
    if (expr === "−") return;
    expr = isOp(expr.slice(-1)) ? expr.slice(0, -1) + k : expr + k;
  }
  function back() { done = false; expr = expr.slice(0, -1); }
  function pct() {
    done = false;
    var n = lastNum();
    if (!n) return;
    var v = String(parseFloat((parseFloat(n) / 100).toPrecision(12)));
    if (v.indexOf("e") !== -1) return;
    expr = expr.slice(0, expr.length - n.length) + v;
  }
  function equals() {
    if (!expr || done) return;
    var s = stripTrail(expr);
    if (!s || s === "−") return;
    try {
      var f = fmt(evaluate(s));
      lastExpr = s; done = true;
      if (f.indexOf("e") !== -1) { resultText = f; expr = ""; } else { expr = f; }
    } catch (e) {
      notice = e.message === "div0" ? "Can't divide by zero" : "Error";
    }
  }

  function press(k) {
    notice = "";
    if (/^\d$/.test(k)) digit(k);
    else if (k === ".") dot();
    else if (isOp(k)) op(k);
    else if (k === "=") equals();
    else if (k === "C") { expr = ""; done = false; lastExpr = ""; }
    else if (k === "⌫") back();
    else if (k === "%") pct();
    render();
  }

  document.getElementById("keys").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) press(b.getAttribute("data-k"));
  });

  var keyMap = { "*": "×", x: "×", X: "×", "/": "÷", "-": "−", "+": "+", Enter: "=", "=": "=",
                 Backspace: "⌫", Escape: "C", c: "C", C: "C", ".": ".", ",": ".", "%": "%" };
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = /^\d$/.test(e.key) ? e.key : keyMap[e.key];
    if (!k) return;
    e.preventDefault();
    press(k);
    var b = document.querySelector('[data-k="' + k + '"]');
    if (b) { b.classList.add("hit"); setTimeout(function () { b.classList.remove("hit"); }, 120); }
  });

  render();
})();
