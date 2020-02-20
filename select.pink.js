// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later

// Copyright (C) 2020 Owen Shepherd

// This code is intentionally left unminified.
// It might be worth avoiding if you don't like spoilers.

// Constants

const REMOVE_OLD = true;
const VERSION = "0.3.4";
const MAX_LEVEL_KEY = "max-level";
const VERSION_KEY = "pink.version";
const SUCCESS = "success";
const ERROR = "error";
const NEUTRAL = "neutral";
const STATUSES = [ERROR, SUCCESS, NEUTRAL];

// DOM search

const q = (query, el = document) => el.querySelector(query);
const qa = (query, el = document) => Array.from(el.querySelectorAll(query));
// const parents = el => produce(el, select("parentNode"));
const domInd = el => [...el.parentNode.childNodes].indexOf(el);

// DOM nodes

const leftArrow = q(".paginator.left");
const rightArrow = q(".paginator.right");
const input = q("#selector-input");
const underlay = q("#underlay");
const overlay = q("#overlay");
const main = q("#main");
const description = q("#description");
const referencesNode = q("#references");

// References

const classSelectorHint = ["class selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/Class_selectors"];
const adjacentSiblingSelectorHint = ["adjacent sibling combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator"];
const siblingHint = ["general sibling combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator"];
const typeSelectors = ["type selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/Type_selectors"];
const idSelectorHint = ["id selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/ID_selectors"];

// Blacklisted selector sets

const nthinate = str => [":nth", ":first", ":last"].map(prefix => `${prefix}-${str}`);
const childNodeBlackLisk = nthinate("child");
const nthTypeBlackList = nthinate("of-type");
const nthBlackList = [...childNodeBlackLisk, ...nthTypeBlackList];

// Levels

const levels =
  // span
  [ { description: "turn the white box pink"
    , blacklist: nthBlackList
    , topology: [{}, { el: "span", target: true }]
    , references: [typeSelectors]
    }
  // div
  , { description: "turn the white boxes pink"
    , blacklist: nthBlackList
    , topology: [{ target: true }, { el: "span" }, { target: true }]
    , references: [typeSelectors]
    }
  // #alice
  , { description: "use the id"
    , blacklist: nthBlackList
    , topology: { sub: { id: "alice", target: true, sub: {} } }
    , references: [idSelectorHint]
    }
  // .bob
  , { description: "use the class"
    , blacklist: nthBlackList
    , topology: { sub: { "class": "bob", target: true, sub: { sub: {} } } }
    , references: [classSelectorHint]
    }
  // .gum.drop
  , { description: "use the classes"
    , blacklist: nthBlackList
    , topology: [ { "class": "gum drop", target: true }
                , { "class":  "gum" }
                , { "class": "drop" }
                ]
    , references: [classSelectorHint]
    }
  // #pan.cake
  , { description: "mix & match"
    , blacklist: nthBlackList
    , topology: [ { "class": "cake" }
                , { id: "pan" }
                , { id: "pan", "class": "cake", target: true }
                ]
    , references: [idSelectorHint, classSelectorHint]
    }
  // *>*
  , { description: "select the child node"
    , blacklist: nthBlackList
    , topology: [{ sub: [{ target: true }] }]
    , references: []
    }
  // *+*
  , { description: "select the (+, ~) sibling"
    , blacklist: nthBlackList
    , topology: [{ sub: [{ "class": "here", sub: [{}]}, { target: true }] }]
    , references: []
    }
  // span:first-of-type
  , { description: "turn the white boxes pink"
    , topology: [{ sub: [{}, { el: "span", target: true }] }, { sub: [{ el: "span", target: true }, { el: "span"}] }]
    , blacklist: [ "," ]
    }
  , { description: "turn the white boxes pink"
    , topology: [{ "class": "here", sub: [{ target: true, sub: [{ sub: [{}] }] }] }]
    }
  , { description: "turn the white boxes pink"
    , topology: [{}, { target: true }]
    }
  , { description: "turn the white boxes pink"
    , topology: [{ target: true }, {}]
    }
  , { description: "turn the white boxes pink"
    , topology: [{}, { target: true }, {}]
    }
  , { description: "turn the white boxes pink"
    , topology: [{ target: true, sub: [{}] }]
    }
  , { description: "turn the white boxes pink"
    , topology: [{ sub: [{ target: true, sub: [{}] }] }]
    }
  , { description: "turn the white boxes pink"
    , topology: [{ sub: [{ target: true }, {}] }, {}, {}]
    }
  ]

// Functional

const l = a => a.length;
const curryN = (n, fn) => (...a) => l(a) >= n ? fn(...a) : curryN(n - l(a), partial(fn, ...a));
const curry = fn => curryN(l(fn), fn);
const select = curry((k, o) => o[k]);
const partial = (fn, ...a1) => (...a2) => fn(...a1, ...a2);
const id = a => a;
const always = a => () => a;
const fst = ([a]) => a;
const snd = ([_, b]) => b;
const unzip = arr => [arr.map(fst), arr.map(snd)];
const range = to => Array(to).fill(0).map((_, i) => i);
const zip = (arr1, arr2) => range(Math.min(l(arr1), l(arr2))).map(i => [arr1[i], arr2[i]]);
const eq = curry((a, b) => a === b);
const not = a => !a;
// homogeneous binary operation to vararg fn
const homBinOp = (fn, identity) => (...args) => args.reduce.apply(args, [fn, identity].filter(id));
const pipe = homBinOp((f1, f2) => (...args) => f2(f1(...args)))
const last = arr => arr[l(arr) - 1];
// const uncurry = fn => a => fn(...a);
// const allEq = (arr1, arr2) => l(arr1) === l(arr2) && zip(arr1, arr2).every(uncurry(eq));
// const produce = (el, fn) => el ? [el, ...produce(fn(el), fn)] : [];

// Either

const LEFT = "left";
const RIGHT = "right";
const tagIs = target => pipe(select("tag"), eq(target));
const isLeft = tagIs(LEFT);
const isRight = tagIs(RIGHT);
const left = data => ({ tag: LEFT, data });
const right = data => ({ tag: RIGHT, data });

const catchToRight = (fn, toErr) => {
  try {
    return right(fn());
  } catch (e) {
    return left(toErr(e));
  }
};

const bind = (either, fn) => {
  if (isRight(either)) return fn(either.data);
  return either;
};

// DOM modification

const attrs = (el, attrs) =>
  id(el, Object.entries(attrs).forEach(([k, v]) => {
    el.setAttribute(k, v);
  }));

const emptyEl = el =>
  id(el, [...el.childNodes].forEach(el => { el.remove(); }));

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
const withEvent = (ev, el, callback) => id(el, el.addEventListener(ev, callback));

// Sets

const difference = homBinOp((setA, setB) => {
  const res = new Set(setA);
  [...setB].forEach(el => { res.delete(el); });
  return res;
});

const union = homBinOp((setA, setB) => new Set([...setA, ...setB]), new Set());
const intersection = homBinOp((setA, setB) => difference(union(setA, setB), difference(setA, setB), difference(setB, setA)));
const symmetricDifference = homBinOp((setA, setB) => difference(union(setA, setB), intersection(setA, setB)));

// Level logic

const levelAmt = l(levels);

const createLevelNodes = (underlay, n) => {
  const nodes = (Array.isArray(n) ? n : [n]).filter(id);
  const [childEls, targetSets] = unzip(nodes.map(createLevelNode(underlay)));
  return [childEls, union(...targetSets)];
};

const quote = s => `"${s}"`;

const createLevelNode = curry((underlay, { el = "div", sub = [], target, ...attrs }) => {
  const [childEls, subTarget] = createLevelNodes(underlay, sub);
  const layer = crel(el, attrs, [
    ...(underlay ? [crel("pre", {"class": "hint"}, [
      crText([el, ...Object.entries(attrs).map(([k, v]) => `${k}=${v.indexOf(' ') > 0 ? quote(v) : v}`)].join('\n'))
   ])] : []),
    ...childEls
  ]);
  if (underlay && target) layer.classList.add("target");
  return [layer, union(target ? [layer] : [], subTarget)];
});

const renderLevelInto = (level, el, underlay) => {
  const [els, targets] = createLevelNodes(underlay, level);
  appendChildren(els, emptyEl(el));
  return targets;
};

const versionStored = localStorage.getItem(VERSION_KEY);
if (REMOVE_OLD && versionStored !== VERSION)
  [MAX_LEVEL_KEY, ...range(levelAmt).map(a => `ans-${a + 1}`)].forEach(k => {
    localStorage.removeItem(k);
  });
localStorage.setItem(VERSION_KEY, VERSION);
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

const level = () => levels[levelNum - 1];

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
  crel("li", {}, [crel("a", { href, target: "_blank" }, [crText(text)])]));

const renderDescription = txt => {
  if ((description.childNodes[0] || {}).data === txt) return;
  appendChildren([crText(txt)], emptyEl(description));
};

const renderLevel = () => {
  const { __description, topology, references = [] } = level();
  appendChildren(toReferences(references), emptyEl(referencesNode));
  renderLevelInto(topology, underlay, true).forEach(el => {
    el.classList.add("target");
  });
  target = renderLevelInto(topology, overlay);
  input.value = localStorage.getItem(`ans-${levelNum}` || "");
  onInputChange();
  paginate();
  return fade({fadein: true, fadeout: false}, 0.2).then(() => {
    setDisabled(false, input);
    input.focus();
    fade({fadeout: false, fadein: false}, 0);
  });
};

const changePage = n => {
  levelNum += n;
  location.hash = levelNum;
  setDisabled(true, input);
  disablePagination(true);
  fade({fadeout: true, fadein: false}, 0).then(renderLevel)
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
  indicate(SUCCESS);
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

function* splitCommas(pairs, q) {
  let res = '';
  const stack = [];
  for (let i = 0; i < l(q); i++) {
    const c = q[i];
    if (pairs[c]) stack.push(pairs[c]);
    if (l(stack) > 0 && last(stack) === c) stack.pop();
    if (l(stack) === 0 && c === ',') {
      yield res;
      res = '';
    } else {
      res += c;
    }
  }
  if (l(stack) > 0) throw new SyntaxError(`Expected '${last(stack)}'`);
  yield res;
}

const addQueryRoot = part => {
  const p = part.trim();
  if (">+~".indexOf(p[0]) >= 0) throw new Error("Selections from root aren't allowed");
  return `#overlay ${p}`;
};

const bracketMatches = { '[': ']', '(': ')' };

const addQueryRoots = query =>
  [...splitCommas(bracketMatches, query)].map(addQueryRoot).join(", ");

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

const indicate = str => {
  STATUSES.filter(pipe(eq(str), not)).forEach(c => {
    main.classList.remove(c);
  });
  main.classList.add(str);
};

const onInvalid = txt => {
  indicate(ERROR);
  setDisabled(true, rightArrow);
  maxLevel = levelNum;
  localStorage.setItem(MAX_LEVEL_KEY, levelNum);
  renderDescription(txt);
};

const getBlacklisted = () => (level().blacklist || []).filter(el => input.value.indexOf(el) >= 0);

const conjugateBlacklist = blacklisted => {
  if (l(blacklisted) === 1) return `${blacklisted[0]} is`;
  if (l(blacklisted)  === 2) return `${blacklisted[0]} and ${blacklisted[1]} are`;
  return `${[blacklisted.slice(0, l(blacklisted) - 1).join(", "), last(blacklisted)].join(", and ")} are`;
};

const getBlacklistResult = () => {
  const blacklisted = getBlacklisted();
  if (l(blacklisted) > 0) return left(`${conjugateBlacklist(blacklisted)} fobidden on this level`);
  return right(null);
};

const getQueryResult = () => bind(getBlacklistResult(), partial(catchToRight, getQueryEls, always("invalid selector")));

const onInputChange = () => {
  const { tag, data } = getQueryResult();
  switch (tag) {
    case LEFT:
      onInvalid(data);
      break;
    case RIGHT:
      renderDescription(level().description);
      clearMatchColours();
      const [els, hls] = data;
      colourMatches(hls);
      if (symmetricDifference(new Set(els), target).size === 0) {
        onComplete();
        setDisabled(false, rightArrow);
      } else {
        indicate(NEUTRAL);
        setDisabled(true, rightArrow);
      }
      break;
  }
};

withEvent("keydown", input, e => {
  if (e.key === "Enter" && levelNum < maxLevel) changePage(1);
});

renderLevel();
onInputChange();
// @license-end
