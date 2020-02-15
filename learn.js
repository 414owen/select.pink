// Functional

const curryN = (n, fn) => (...a) =>
  a.length >= n ? fn(...a) : curryN(n - a.length, (...a2) => fn(...a, ...a2));

const curry = fn => curryN(fn.length, fn);

const partial = (fn, ...a1) => (...a2) => fn(...a1, ...a2);

const id = a => a;

const fst = ([ a ]) => a;

const snd = ([ _, b ]) => b;

const unzip = arr => [ arr.map(fst), arr.map(snd) ];

const range = to => Array(to).fill(0).map((_, i) => i);

const zip = (arr1, arr2) =>
  range(Math.min(arr1.length, arr2.length)).map(i => [arr1[i], arr2[i]]);

const eq = (a, b) => a === b;

const uncurry = fn => a => fn(...a);

const allEq = (arr1, arr2) => arr1.length === arr2.length &&
  zip(arr1, arr2).every(uncurry(eq));

const select = curry((k, o) => o[k]);

const produce = (el, fn) => el ? [el, ...produce(fn(el), fn)] : [];

// DOM search

const q = (query, el = document) => el.querySelector(query);

const qa = (query, el = document) => Array.from(el.querySelectorAll(query));

const parents = el => produce(el, select("parentNode"));

// DOM modification

const attrs = (el, attrs) =>
  id(el, Object.entries(attrs).forEach(
    ([ key, val ]) => el[ key ] = val
  ));

const emptyEl = el =>
  id(el, Array.from(el.childNodes).forEach(el => { el.remove(); }));

const appendChildren = (children, el) =>
  id(el, children.forEach(child => el.appendChild(child)));

const classMod = (classes, el) =>
  id(el, Object.entries(classes).forEach(
    ([k, v]) => el.classList[v ? "add" : "remove"](k)
  ));

const setDisabled = (disabled, el) => classMod({ disabled }, el);

// DOM creation

const crel = (el, atts = {}, children = []) => appendChildren(children, attrs(document.createElement(el), atts));

const crText = str => document.createTextNode(str);

const withEvent = curry((ev, el, callback) => id(el, el.addEventListener("click", callback)));

const withClick = withEvent("click");

// Levels

const levels =
/*  1 */ [ [ { }, { el: "span", target: true } ]
/*  2 */ , [ { children: [ { target: true } ] } ]
/*  3 */ , [ { target: true }, {} ]
/*  4 */ , [ {}, { target: true } ]
/*  5 */ , [ {}, { target: true }, {} ]
/*  6 */ , [ { target: true, children: [ {} ] } ]
/*  7 */ , [ { children: [ { target: true, children: [ {} ] } ] } ]
/*  8 */ , [ { children: [ { target: true }, {} ] }, {}, {} ]
/*  9 */ , [ { children: [ { className: "here", target: true, children: [ { children: [ {}, {} ] } ] } ] } ]
         ]

// Level logic

const levelAmt = levels.length;

const createLevelNodes = (underlay, nodes) => {
  const [ childEls, targets ] = unzip(nodes.map(createLevelNode(underlay)));
  return [ childEls, targets.find(id) ];
};

const createLevelNode = curry((underlay, { el = "div", children = [], target, ...attrs }) => {
  const [ childEls, subTarget ] = createLevelNodes(underlay, children);
  const layer = crel(el, attrs, [
    ...(underlay ? [crel("pre", {className: "hint"}, [
      crText([el, ...Object.entries(attrs).map(([k, v]) => `${k}=${v}`)].join('\n'))
    ])] : []),
    ...childEls
  ]);
  if (underlay && target) layer.classList.add("target");
  return [ layer, target ? layer : subTarget ];
});

const renderLevelInto = (level, el, underlay) => {
  const [ els, target ] = createLevelNodes(underlay, level);
  appendChildren(els, emptyEl(el));
  return target;
};

const renderLevel = level => {
  renderLevelInto(level, underlay, true).classList.add("target");
  return renderLevelInto(level, overlay);
};

const leftArrow = q(".paginator.left");
const rightArrow = q(".paginator.right");
const input = q("#selector-input");
const css = q("#interactive-css");
const underlay = q("#underlay");
const overlay = q("#overlay");

const MAX_LEVEL_KEY = "max-level";

const parseLevel = (s, sub = 0) => Math.max(Math.min(parseInt(s, 10) - sub || 0, levelAmt - 1), 0);

let maxLevel = Math.min(levelAmt, parseLevel(localStorage.getItem(MAX_LEVEL_KEY)));
let levelNum = Math.min(maxLevel, parseLevel(location.hash.slice(1), 1));
location.hash = levelNum + 1;
let target = null;

const paginate = () => {
  setDisabled(levelNum <= 0, leftArrow);
  setDisabled(levelNum >= Math.min(levelAmt - 1, maxLevel), rightArrow);
  rightArrow.href = `#${levelNum + 2}`;
  leftArrow.href = `#${levelNum}`;
};

const level = () => {
  paginate();
  target = renderLevel(levels[levelNum]);
};

level(levelNum);

const changePage = n => { levelNum += n; input.innerHTML = ""; setTimeout(level); }

withClick(rightArrow, () => { rightArrow.classList.remove("shiny"); });

const unlockLevel = () => {
  maxLevel = Math.min(levelNum + 1, levelAmt);
  localStorage.setItem(MAX_LEVEL_KEY, maxLevel);
  paginate();
  rightArrow.classList.add("shiny");
  rightArrow.focus();
};

const win = () => {
  document.body.classList.add("won");
};

const onComplete = () => {
  if (levelNum + 1 === levelAmt) win();
  else unlockLevel();
};

const isInLevel = el => parents(el).some(el => el.id === "overlay");

const clearMatchColours = () => {
  qa("#overlay .selected").forEach(el => {
    el.classList.remove("selected");
  });
};

const colourMatches = selector => {
  qa(selector).forEach(el => {
    if (isInLevel(el)) el.classList.add("selected");
  });
};

const onInputChange = () => {
  const selector = `#overlay ${input.innerText.trim()}`;
  clearMatchColours();
  colourMatches(selector);
  if (allEq(qa(selector), [target])) onComplete();
};

onInputChange();

const trim = ({target: el}) => {
  if (el.innerHTML.trim() === '<br>') el.innerHTML='';
};
