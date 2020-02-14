// Functional

const curryN = (n, fn) => (...a) =>
  a.length === n ? fn(...a) : curryN(n - a.length, (...a2) => fn(...a, ...a2));

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

// DOM search

const q = (query, el = document) => el.querySelector(query);
const qa = (query, el = document) => Array.from(el.querySelectorAll(query));

// DOM modification

const attrs = (el, attrs) =>
  id(el, Object.entries(attrs).forEach(
    ([ key, val ]) => el[ key ] = val
  ));

const emptyEl = el =>
  id(el, Array.from(el.childNodes).forEach(el => { el.remove(); }));

const appendChildren = (children, el) =>
  id(el, children.forEach(child => el.appendChild(child)));

const classMod = (classes, el) => id(el,
    Object.entries(classes).forEach(([k, v]) => el.classList[v ? "add" : "remove"](k))
  );

const setDisabled = (disabled, el) => classMod({ disabled }, el);

// DOM creation

const crel = (el, atts, children) => appendChildren(children, attrs(document.createElement(el), atts));

const crText = str => document.createTextNode(str);

const withEvent = curry((ev, el, callback) => id(el, el.addEventListener("click", callback)));

const withClick = withEvent("click");

// Levels

const underlay = q("#underlay");

const overlay = q("#overlay");

const levelOne =
  [ { }, { target: true } ];

const levelTwo =
  [ { className: "test", children:
      [ { el: "span", className: "testTwo", target: true } ]
    }
  ];

const levels =
  [ levelOne
  , levelTwo
  ];


// Level logic

const levelAmt = levels.length;

const createLevelNodes = nodes => {
  const [ childEls, targets ] = unzip(nodes.map(createLevelNode));
  return [ childEls, targets.find(id) ];
};

const createLevelNode = ({ el = "div", children = [], target, ...attrs }) => {
  const [ childEls, subTarget ] = createLevelNodes(children);
  const layer = crel(el, attrs, childEls);
  return [ layer, target ? layer : subTarget ];
};

const renderLevelInto = (level, el) => {
  const [ els, target ] = createLevelNodes(level);
  appendChildren(els, emptyEl(el));
  return target;
};

const renderLevel = level => {
  renderLevelInto(level, underlay).style.backgroundColor = "#a00";
  return renderLevelInto(level, overlay);
};

const leftArrow = q(".paginator.left");

const rightArrow = q(".paginator.right");

const parseLevel = s => Math.max(Math.min(parseInt(s, 10) - 1 || 0, levelAmt - 1), 0);

let maxLevel = Math.min(levelAmt, parseLevel(localStorage.getItem("max-lev")));
let target = null;

let levelNum = Math.min(maxLevel, parseLevel(location.hash.slice(1)));
location.hash = levelNum + 1;

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
const onPaginateLeft = () => { levelNum--; setTimeout(level); };
const onPaginateRight = () => { levelNum++; setTimeout(level); };

const input = q("#selector-input");
const css = q("#interactive-css");

const onInputChange = () => {
  const selector = `#overlay ${input.value}`;
  css.innerText = `
    ${selector} {
      background-color: rgba(0, 255, 0, 0.5);
    }
  `;
  if (allEq(qa(selector), [target])) {
    if (levelNum + 1 === levelAmt) input.value = "YOU WIN!";
    else {
      maxLevel = Math.min(levelNum + 1, levelAmt);
      paginate();
    }
  }
};

onInputChange();
