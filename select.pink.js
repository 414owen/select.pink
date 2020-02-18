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

const last = arr => arr[arr.length - 1];

// associative binary operation to vararg fn
const assocBinOp = (fn, identity) => (...args) => args.reduce(fn, identity);

// DOM search

const q = (query, el = document) => el.querySelector(query);

const qa = (query, el = document) => Array.from(el.querySelectorAll(query));

const parents = el => produce(el, select("parentNode"));

const domInd = el => [...el.parentNode.childNodes].indexOf(el);

// DOM modification

const attrs = (el, attrs) =>
  id(el, Object.entries(attrs).forEach(([k, v]) => {
    el.setAttribute(k, v);
  }));

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

const withEvent = curry((ev, el, callback) => id(el, el.addEventListener(ev, callback)));

const withClick = withEvent("click");

// Sets

// (from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
const symmetricDifference = (setA, setB) => {
  let _difference = new Set(setA);
  for (let elem of setB) {
    if (_difference.has(elem)) {
      _difference.delete(elem);
    } else {
      _difference.add(elem);
    }
  }
  return _difference;
}

const union2 = (setA, setB) => new Set([...setA, ...setB]);
const union = assocBinOp(union2, new Set());

// Levels

const classSelectorHint = [ "class selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/Class_selectors" ];
const adjacentSiblingSelectorHint = [ "adjacent sibling combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator" ];
const siblingHint = [ "general sibling combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator" ];
const typeSelectors = [ "type selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/Type_selectors" ];
const idSelectorHint = [ "id selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/ID_selectors" ];

const childSelectors = [ ":nth-child", ":first-child", ":last-child", ":nth-child" ];

const levels =
  // span
  [ { description: "turn the white box pink"
    , topology: [ {}, { el: "span", target: true } ]
    , references: [ typeSelectors ]
    }
  // div
  , { description: "turn the white boxes pink"
    , topology: [ { target: true }, { el: "span" }, { target: true } ]
    , references: [ typeSelectors ]
    }
  // #alice
  , { description: "use the id"
    , topology: { sub: { "class": "alice", target: true, sub: {} } }
    , references: [ idSelectorHint ]
    }
  // .bob
  , { description: "use the class"
    , topology: { sub: { "class": "bob", target: true, sub: { sub: {} } } }
    , references: [ classSelectorHint ]
    }
  // .octo.pus
  , { description: "use the classes"
    , blacklist: childSelectors
    , topology: [ { "class": "gum drop" }
                , { "class":  "gum" }
                , { sub: { sub: { "class": "drop", sub: {} } } }
                ]
    , references: [ classSelectorHint]
    }
  // #pan.cake
  , { description: ""
    , blacklist: childSelectors
    , topology: [ { sub: { "class": "cake" } }
                , { sub: [ { id: "pan" }
                         , { id: "pan", "class": "cake", target: true }
                         ]
                  }
                ]
    , references: [ idSelectorHint, classSelectorHint ]
    }
  // *>*
  , { description: "select the child node"
    , topology: [ { sub: [ { target: true } ] } ]
    , references: [ ]
    }
  // *+*
  , { description: "select the (+, ~) sibling"
    , topology: [ { sub: [ { "class": "here", sub: [ {} ]}, { target: true }] } ]
    , references: [ ]
    }
  , { description: "turn the white boxes pink"
    , topology: [ { "class": "here", sub: [ { target: true, sub: [ { sub: [ {} ] } ] } ] } ]
    }
  , { description: "turn the white boxes pink"
    , topology: [ {}, { target: true } ]
    }
  , { description: "turn the white boxes pink"
    , topology: [ { target: true }, {} ]
    }
  , { description: "turn the white boxes pink"
    , topology: [ {}, { target: true }, {} ]
    }
  , { description: "turn the white boxes pink"
    , topology: [ { target: true, sub: [ {} ] } ]
    }
  , { description: "turn the white boxes pink"
    , topology: [ { sub: [ { target: true, sub: [ {} ] } ] } ]
    }
  , { description: "turn the white boxes pink"
    , topology: [ { sub: [ { target: true }, {} ] }, {}, {} ]
    }
  ]

// Level logic

const levelAmt = levels.length;

const createLevelNodes = (underlay, n) => {
  const nodes = (Array.isArray(n) ? n : [ n ]).filter(id);
  const [ childEls, targetSets ] = unzip(nodes.map(createLevelNode(underlay)));
  return [ childEls, union(...targetSets) ];
};

const createLevelNode = curry((underlay, { el = "div", sub = [], target, ...attrs }) => {
  const [ childEls, subTarget ] = createLevelNodes(underlay, sub);
  const layer = crel(el, attrs, [
    ...(underlay ? [crel("pre", {"class": "hint"}, [
      crText([el, ...Object.entries(attrs).map(([k, v]) => `${k}=${v.indexOf(' ') > 0 ? `"${v}"` : v}`)].join('\n'))
    ])] : []),
    ...childEls
  ]);
  if (underlay && target) layer.classList.add("target");
  return [ layer, union(target ? [ layer ] : [], subTarget) ];
});

const renderLevelInto = (level, el, underlay) => {
  const [ els, targets ] = createLevelNodes(underlay, level);
  appendChildren(els, emptyEl(el));
  return targets;
};

const renderLevel = level => {
  renderLevelInto(level, underlay, true).forEach(el => {
    el.classList.add("target");
  });
  return renderLevelInto(level, overlay);
};

const leftArrow = q(".paginator.left");
const rightArrow = q(".paginator.right");
const input = q("#selector-input");
const css = q("#interactive-css");
const underlay = q("#underlay");
const overlay = q("#overlay");
const indicator = q("#indicator");
const description = q("#description");
const referencesNode = q("#references");

const MAX_LEVEL_KEY = "max-level";

const parseLevel = s => Math.max(Math.min(parseInt(s, 10) || 1, levelAmt), 1);
let maxLevel = Math.min(levelAmt, parseLevel(localStorage.getItem(MAX_LEVEL_KEY)));
let levelNum = Math.min(maxLevel, parseLevel(location.hash.slice(1)));
location.hash = levelNum;
let target = null;

const paginate = () => {
  setDisabled(levelNum <= 1, leftArrow);
  rightArrow.href = `#${levelNum + 1}`;
  leftArrow.href = `#${levelNum - 1}`;
};

const disablePagination = to => {
  setDisabled(to, leftArrow);
  setDisabled(to, rightArrow);
};

const fade = (classes, delay) =>
  Promise.all(qa("#underlay > *").map((el, i) => new Promise(res => {
    classMod(classes, el);
    el.style.animationDelay = `${delay * i}s`;
    withEvent("animationend", el, res)
  })));

const toReferences = references => references.map(([text, href]) =>
  crel("li", {}, [ crel("a", { href, target: "_blank" }, [ crText(text) ]) ]));

const level = () => {
  const { description: txt, topology, references } = levels[levelNum - 1];
  appendChildren([crText(txt)], emptyEl(description));
  appendChildren(toReferences(references), emptyEl(referencesNode));
  target = renderLevel(topology);
  input.value = localStorage.getItem(`ans-${levelNum}` || "");
  onInputChange();
  paginate();
  return fade({fadein: true, fadeout: false}, 0.2).then(() => {
    setDisabled(false, input);
    input.focus();
    fade({fadeout: false, fadein: false}, 0);
  });
};

const clearInput = () => {
  input.value = "";
  indicator.className = "neutral";
};

const changePage = n => {
  levelNum += n;
  location.hash = levelNum;
  setDisabled(true, input);
  disablePagination(true);
  fade({fadeout: true, fadein: false}, 0).then(level)
};

const unlockLevel = () => {
  maxLevel = Math.min(levelNum + 1, levelAmt);
  localStorage.setItem(MAX_LEVEL_KEY, maxLevel);
  paginate();
};

const win = () => {
  document.body.classList.add("won");
};

const onComplete = () => {
  indicator.className = "success";
  localStorage.setItem(`ans-${levelNum}`, input.value);
  if (levelNum === levelAmt) win();
  else unlockLevel();
};

const clearMatchColours = () => {
  qa("#underlay .selected").forEach(el => {
    el.classList.remove("selected");
  });
};

const colourMatches = els => {
  els.forEach(el => {
    el.classList.add("selected");
  });
};

const whitespaceRegex = /^\s+$/;
const isWhitespace = c => whitespaceRegex.test(c);

function* splitCommas(pairs, q) {
  let res = '';
  const stack = [];
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    if (pairs[c]) stack.push(pairs[c]);
    if (stack.length > 0 && last(stack) === c) stack.pop();
    if (stack.length === 0 && c === ',') {
      yield res;
      res = '';
    } else {
      res += c;
    }
  }
  if (stack.length > 0) throw new SyntaxError(`Expected '${last(stack)}'`);
  yield res;
}

const addQueryRoots = query =>
  `${[...splitCommas({ '[': ']', '(': ')' }, query)].map(part => {
    const p = part.trim();
    if (">+~".indexOf(p[0]) >= 0) throw new Error("Selections from root aren't allowed");
    return `#overlay ${p}`;
  }).join(", ")}`;

const toPath = el => {
  const res = [];
  while (el !== overlay) {
    res.push(domInd(el));
    el = el.parentNode;
  }
  return res.reverse();
};

const followPath = curry((node, path) => {
  let res = node;
  path.forEach(i => {
    res = res.childNodes[i];
  });
  return res;
});

const getQueryEls = () => {
  const paths = qa(`${addQueryRoots(input.value.trim())}`, overlay)
    .map(el => toPath(el));
  return [paths.map(followPath(overlay)), paths.map(path =>
    followPath(underlay, path.map((n, i) => i === 0 ? n : n + 1))
  )];
};

const onInputChange = () => {
  clearMatchColours();
  let els;
  try {
    [els, hls] = getQueryEls();
  } catch(e) {
    indicator.className = "error";
    setDisabled(true, rightArrow);
    return;
  }
  colourMatches(hls);
  if (symmetricDifference(new Set(els), target).size === 0) {
    onComplete();
    setDisabled(false, rightArrow);
  } else {
    setDisabled(true, rightArrow);
    indicator.className = "neutral";
  }
};

withEvent("keydown", input, e => {
  if (event.key === "Enter" && levelNum < maxLevel) changePage(1);
});

level();
onInputChange();
