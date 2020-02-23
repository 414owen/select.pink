// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later

// Copyright (C) 2020 Owen Shepherd

// This code is intentionally left unminified.
// It might be worth avoiding if you don't like spoilers.

// Constants

const MAX_LEVEL_KEY = "max-level";
const SUCCESS = "success";
const ERROR = "error";
const NEUTRAL = "neutral";
const STATUSES = [ERROR, SUCCESS, NEUTRAL];
const FADE_IN_TIME = 1;

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
// const zip = (arr1, arr2) => range(Math.min(l(arr1), l(arr2))).map(i => [arr1[i], arr2[i]]);
const eq = curry((a, b) => a === b);
const not = a => !a;
// homogeneous binary operation to vararg fn
const homBinOp = (fn, identity) => (...args) => args.reduce.apply(args, [fn, identity].filter(id));
const pipe = homBinOp((f1, f2) => (...args) => f2(f1(...args)))
const last = arr => arr[l(arr) - 1];
const entries = o => Object.entries(o);
const mappedEntries = (o, fn) => entries(o).map(fn);
const map = curry((fn, arr) => arr.map(fn));
const adjust = curry((fn, obj, k) => ({ ...obj, [k]: fn(obj[k]) }));
const def = curry((d, actual) => actual || d);
const defArr = def([]);
const cons = curry((el, arr) => [el, ...arr]);
const groupBy = curry((project, arr) => arr.reduce((acc, el) => adjust(pipe(defArr, cons(el)), acc, project(el)), {}));
const dropParam = fn => (__, ...args) => fn(...args);
const contains = curry((el, a) => a.indexOf(el) >= 0);
// const uncurry = fn => a => fn(...a);
// const allEq = (arr1, arr2) => l(arr1) === l(arr2) && zip(arr1, arr2).every(uncurry(eq));
// const produceWhileTruthy = (fn, ind = 0, el = undefined) => {
//   const res = [];
//   while (ind === 0 || el) {
//     res.push(el = fn(ind, el));
//     ind += 1;
//   }
//   return res;
// };
// const produce = fn => el ? [el, ...produce(fn(el), fn)] : [];

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
const referenceContainer = referencesNode.parentNode;

// References

const classSelectorHint = ["class selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/Class_selectors"];
const adjacentSiblingSelectorHint = ["adjacent sibling combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator"];
const siblingHint = ["general sibling combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator"];
const typeSelectorsHint = ["type selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/Type_selectors"];
const firstOfTypeHint = ["first of type selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:first-of-type"];
const lastOfTypeHint = ["last of type selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:last-of-type"];
const nthOfTypeHint = ["nth of type selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-of-type"];
const nthLastOfTypeHint = ["nth last of type selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-of-type"];
const firstChildHint = ["first child selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:first-child"];
const lastChildHint = ["last child selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:last-child"];
const nthChildHint = ["nth child selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child"];
const nthLastChildHint = ["nth last child selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-child"];
const idSelectorHint = ["id selectors", "https://developer.mozilla.org/en-US/docs/Web/CSS/ID_selectors"];
const attributeSelectorHint = ["attribute selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors"];
const decendantCombinatorHint = ["decentant combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator"];
const childCombinatorHint = ["child combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/Child_combinator"];
const emptyHint = ["empty selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:empty"];
const notHint = ["not combinator", "https://developer.mozilla.org/en-US/docs/Web/CSS/:not"];
const definedHint = ["defined selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:defined"];
const langHint = ["language selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/:lang"];

// Split query on root-level commas

function* splitCommas(q, throws = true, pairs = { '[': ']', '(': ')' }) {
  let ind = 0, stack = [], c = q[0];
  for (let i = 0; i < l(q); i++, c = q[i]) {
    if (pairs[c]) stack.push(pairs[c]);
    if (l(stack) > 0 && last(stack) === c) stack.pop();
    if (l(stack) !== 0 || c !== ',') continue;
    yield q.slice(ind, i);
    ind = i + 1;
  }
  if (throws && l(stack) > 0) throw new SyntaxError(`Expected '${last(stack)}'`);
  yield q.slice(ind);
}

// Blacklisted selector sets

const typeBlacklister = curry((type, txt, test = contains) => ({ txt, type, test }));
const selectorBlacklist = typeBlacklister("selector");
const nthinate = str => [":nth", ":nth-last", ":first", ":last"].map(prefix => selectorBlacklist(`${prefix}-${str}`));
const combinatorBlacklist = typeBlacklister("combinator");
const containsCommaCombinator = str => l([...splitCommas(str, false)]) > 1;
const commaBlacklist = combinatorBlacklist(",", dropParam(containsCommaCombinator));
const childNodeBlackLisk = nthinate("child");
const nthTypeBlackList = nthinate("of-type");
const nthBlackList = [...childNodeBlackLisk, ...nthTypeBlackList];
const emptyBlacklist = selectorBlacklist(":empty");
const siblingBlacklist = ["+", "~"].map(a => combinatorBlacklist(a));
const elBlacklist = ["div", "span"].map(a => selectorBlacklist(a));
const eqBlacklist = combinatorBlacklist("=");

// Levels

const levels =
  [ { description: "turn the white box pink"
    , optimal: "span"
    , blacklist: [...nthBlackList, commaBlacklist]
    , topology: [{}, { el: "span", target: true }]
    , references: [typeSelectorsHint]
    }
  , { description: "turn the white boxes pink"
    , optimal: "div"
    , blacklist: nthBlackList
    , topology: [{ target: true }, { el: "span" }, { target: true }]
    , references: [typeSelectorsHint]
    }
  , { description: "use the id"
    , optimal: "#alice"
    , blacklist: nthBlackList
    , topology: { sub: { id: "alice", target: true, sub: {} } }
    , references: [idSelectorHint]
    }
  , { description: "use the class"
    , optimal: ".bob"
    , blacklist: nthBlackList
    , topology: { sub: { "class": "bob", target: true, sub: { sub: {} } } }
    , references: [classSelectorHint]
    }
  , { description: "use the classes"
    , optimal: ".gum.drop"
    , blacklist: nthBlackList
    , topology: [ { "class": "gum drop", target: true }
                , { "class":  "gum" }
                , { "class": "drop" }
                ]
    , references: [classSelectorHint]
    }
  , { description: "mix & match"
    , optimal: "#pan.cake"
    , blacklist: nthBlackList
    , topology: [ { "class": "cake" }
                , { id: "pan" }
                , { id: "pan", "class": "cake", target: true }
                ]
    , references: [idSelectorHint, classSelectorHint]
    }
  , { description: "select the decendant nodes"
    , optimal: "*>*"
    , blacklist: [commaBlacklist, emptyBlacklist]
    , topology: [{ sub: { target: true, sub: { target: true } } }]
    , references: [decendantCombinatorHint]
    }
  , { description: "select the child node"
    , optimal: "#top>*"
    , blacklist: [emptyBlacklist]
    , topology: [{ id: "top", sub: { target: true, sub: { sub: {} } } }]
    , references: [childCombinatorHint]
    }
  , { description: "select the siblings"
    , optimal: ".tilde~*"
    , topology: [{ sub: [{"class": "tilde"}, { target: true }, { target: true }, { target: true }] }, { sub: [{}, {}, {"class": "tilde"}, {target: true}] }]
    , references: [siblingHint]
    }
  , { description: "select the direct siblings"
    , optimal: ".here+*"
    , topology: [{ sub: [{}, { "class": "here" }, { target: true }, { }] }, { sub: [{"class": "here"}, {target: true}] }]
    , references: [adjacentSiblingSelectorHint]
    }
  , { description: "use the attribute"
    , optimal: "[data-answer]"
    , topology: [{ sub: { "data-answer": "42", target: true } }, { sub: [{ sub: {} }, {}] }]
    , references: [attributeSelectorHint]
    }
  , { description: "select the first boxes"
    , optimal: ":first-child"
    , blacklist: [...nthTypeBlackList, commaBlacklist]
    , topology: [{ target: true, sub: { target: true } }, { sub: { target: true } }]
    , references: [firstChildHint, nthChildHint]
    }
  , { description: "select the second box"
    , optimal: ":nth-child(2)"
    , blacklist: [...nthTypeBlackList, ...siblingBlacklist]
    , topology: [{}, { target: true }, {}]
    , references: [nthChildHint]
    }
  , { description: "select the last boxes"
    , optimal: "*>:last-child"
    , blacklist: nthTypeBlackList
    , topology: [{ sub: [{}, { target: true }] }, { sub: [{}, {}, { target: true }] }]
    , references: [lastChildHint, nthLastChildHint]
    }
  , { description: "select the first spans"
    , optimal: "span:first-of-type"
    , topology: [{ sub: [{}, { el: "span", target: true }] }, { sub: [{ el: "span", target: true }, { el: "span"}] }]
    , blacklist: [commaBlacklist]
    , references: [firstOfTypeHint, nthOfTypeHint]
    }
  , { description: "select the second last spans"
    , optimal: "span:nth-last-of-type(2)"
    , topology: [{ sub: [{ el: "span" }, { el: "span", target: true }, { el: "span" }] }, { sub: [{ el: "span", target: true }, { el: "span"}] }]
    , blacklist: [commaBlacklist]
    , references: [nthLastOfTypeHint]
    }
  , { description: "select the empty elements"
    , optimal: ":empty"
    , topology: [{ sub: { target: true } }, { sub: [{ sub: { sub: { target: true } } }] }]
    , references: [emptyHint]
    }
  , { description: "do the opposite"
    , optimal: ":not(:empty)"
    , topology: [{ target: true, sub: { target: true, sub: {} } }]
    , references: [notHint, emptyHint]
    }
  , { description: "10x it"
    , optimal: "div:not(:last-child)"
    , topology:
      [ { el: "span", sub:
          [ { target: true }
            , { target: true }
            , { sub:
                [ { target: true }
                , { el: "span"
                  , sub: {}
                  }
                ]
              }
           ]
         }
      , { target: true }
      , { target: true }
      , { target: true }
      , { target: true }
      , { target: true }
      , { target: true }
      , { target: true }
      , { target: true }
      , { el: "test" }
      , { target: true }
      , {}
      ]
    , references: [notHint, firstChildHint]
    }
  , { description: "lang"
    , optimal: ":lang(fr)"
    , blacklist: [eqBlacklist]
    , topology: [{ sub: { lang: "de"} }, { lang: "fr", target: true }, { sub: { sub: [ { target: true, lang: "fr" }, { lang: "en" }] } }]
    , references: [langHint]
    }
  // , { description: "do these even exist?"
  //   , optimal: ":not(:defined)"
  //   , blacklist: elBlacklist
  //   , references: [definedHint, notHint]
  //   , topology: [{ sub:
  //       [ { target: true, el: "yotta" }
  //       , { target: true, el: "zetta" }
  //       , {}
  //       ]
  //     }, { sub: { sub:
  //       [ {}
  //       , {target: true, el: "muon" }
  //       , {target: true, el: "tao" }
  //       , {target: true, el: "charm" }
  //       , {el: "span" }
  //       , {target: true, el: "strange" }
  //       , {target: true, el: "higgs" }
  //       ] } }]
  //   }
  ];

// Either

const LEFT = "left";
const RIGHT = "right";
const tagIs = target => pipe(select("tag"), eq(target));
const isLeft = tagIs(LEFT);
const isRight = tagIs(RIGHT);
const left = data => ({ tag: LEFT, data });
const right = data => ({ tag: RIGHT, data });

// exceptions -> eithers
const catchToRight = (fn, toErr = id) => {
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

const setDisabled = (disabled, el) => {
  el.disabled = disabled;
  return classMod({ disabled }, el);
};

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

const quote = (c, s) => `${c}${s}${c}`;
const needsQuoteReg = /(\s|,)/;
const needsQuoting = s => needsQuoteReg.test(s);
const withQuotes = curry((c, s) => needsQuoting(s) ? quote(c, s) : s);
const toAttrHintText = ([k, v]) => `${k}=${withQuotes('"', v)}`;
const toHintText = (el, attrs) => crText([ el, ...mappedEntries(attrs, toAttrHintText) ].join('\n'));
const toHint = (el, attrs) =>
  crel("pre", {"class": "hint"}, [
    toHintText(el, attrs)
  ]);

const createLevelNode = curry((isInderlay, { el = "div", sub = [], target, ...attrs }) => {
  const [childEls, subTarget] = createLevelNodes(isInderlay, sub);
  const layer = crel(el, attrs, [
    ...(isInderlay ? [toHint(el, attrs)] : []),
    ...childEls
  ]);
  if (isInderlay && target) layer.classList.add("target");
  return [layer, union(target ? [layer] : [], subTarget)];
});

const renderLevelInto = (level, el, isInderlay) => {
  const [els, targets] = createLevelNodes(isInderlay, level);
  appendChildren(els, emptyEl(el));
  return targets;
};

const parseLevel = s => Math.max(Math.min(parseInt(s, 10) || 1, levelAmt), 1);

const addQueryRoot = part => {
  const p = part.trim();
  if (contains(p[0], ">+~")) throw new Error("Selections from root aren't allowed");
  return `#overlay ${p}`;
};

const addQueryRoots = query =>
  Array.from(splitCommas(query), addQueryRoot).join(", ");

const getQueryEls = (root, query) =>
  qa(`${addQueryRoots(query).trim()}`, root);

const getBlacklisted = (level, selector) => (level.blacklist || []).filter(({ txt, test }) => test(txt, selector));

const isValidAnswer = (level, selector) => {
  const root = crel("div", { id: "overlay" });
  const targets = renderLevelInto(level, root);
  let els;
  try {
    els = getQueryEls(root, selector);
  } catch (e) {
    return false;
  }
  if (l(getBlacklisted(level, selector)) > 0) return false;
  return symmetricDifference(new Set(els), targets).size === 0;
};

let levelNum = parseLevel(location.hash.slice(1));
for (let i = 1; i < levelNum; i++) {
  const ans = localStorage.getItem(`ans-${i}`);
  if (!(ans && isValidAnswer(levels[i - 1].topology, ans))) {
    levelNum = i;
    break;
  }
}
location.hash = levelNum;
let targets = null;

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

const isHint = pipe(
  select("classList"),
  Array.from,
  contains("hint")
);

function* fadeEls(reverse, roots = qa("#underlay > *", underlay)) {
  for (let i in roots) {
    const subs = [...roots[i].childNodes].filter(pipe(isHint, not));
    if (!reverse) yield roots[i];
    yield* fadeEls(reverse, subs);
    if (reverse) yield roots[i];
  }
}

const fade = (classes, reverse) =>
  Promise.all([...fadeEls(reverse)].map((el, i, arr) => new Promise(res => {
    el.style.animationDuration = `${FADE_IN_TIME / l(arr)}s`;
    el.style.animationDelay = `${i * FADE_IN_TIME / l(arr)}s`;
    classMod(classes, el);
    withEvent("animationend", el, e => {
      res();
      e.stopPropagation();
    })
  })));

const toReferences = map(([text, href]) =>
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
  targets = renderLevelInto(topology, overlay);
  input.value = localStorage.getItem(`ans-${levelNum}` || "");
  return fade({fadein: true, fadeout: false}).then(() => {
    [...fadeEls()].forEach(el => {
      el.classList.remove("fadein");
    });
    paginate()
    onInputChange();
    setDisabled(false, input);
    input.focus();
  });
};

const changePage = n => {
  levelNum += n;
  referenceContainer.open = false;
  location.hash = levelNum;
  setDisabled(true, input);
  disablePagination(true);
  if (levelNum > levelAmt) win();
  else fade({fadeout: true, fadein: false}, true).then(renderLevel)
};

const win = () => {
  document.body.classList.add("won");
};

const onComplete = () => {
  indicate(SUCCESS);
  localStorage.setItem(`ans-${levelNum}`, input.value);
  setDisabled(false, rightArrow);
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

// skips hints
const offsetPath = map((n, i) => i === 0 ? n : n + 1);

const getCurrentQueryEls = () => {
  const paths = getQueryEls(overlay, input.value).map(el => toPath(el));
  return [paths.map(followPath(overlay)), paths.map(pipe(offsetPath, followPath(underlay)))];
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
  localStorage.setItem(MAX_LEVEL_KEY, levelNum);
  renderDescription(txt);
};

const conjugateGroup = (type, elems) => {
  if (l(elems) === 1) return `the ${elems[0]} ${type}`;
  if (l(elems) === 2) {
    return `the ${elems[0]} and ${elems[1]} ${type}s`;
  }
  return `${[elems.slice(0, l(elems) - 1).join(", "), last(elems)].join(", and ")} ${type}s`;
};

const conjugateBlacklist = blacklisted => {
  const groups = groupBy(select("type"), blacklisted);
  return entries(groups)
    .sort(([_, a], [__, b]) => l(a) - l(b))
    .map(([k, v]) =>
      conjugateGroup(k, v.map(pipe(select("txt"), withQuotes("'"))))
    ).join(", and ") + (l(blacklisted) > 1 ? " are" : " is");
};

const getBlacklistResult = () => {
  const blacklisted = getBlacklisted(level(), input.value);
  if (l(blacklisted) > 0) return left(`${conjugateBlacklist(blacklisted)} forbidden on this level`);
  return right(null);
};

const getQueryResult = () => bind(getBlacklistResult(), partial(catchToRight, getCurrentQueryEls, always("invalid selector")));

const notCompleted = () => {
  indicate(NEUTRAL);
  setDisabled(true, rightArrow);
};

const onValid = ([els, hls]) => {
  renderDescription(level().description);
  clearMatchColours();
  colourMatches(hls);
  if (symmetricDifference(new Set(els), targets).size === 0) onComplete();
  else notCompleted();
};

const onInputChange = () => {
  const { tag, data } = getQueryResult();
  if (tag === LEFT) onInvalid(data);
  else onValid(data);
};

withEvent("keydown", input, e => {
  const { tag, data } = getQueryResult();
  if (e.key === "Enter" && tag === RIGHT && symmetricDifference(new Set(data[0]), targets).size === 0) changePage(1);
});

renderLevel();
onInputChange();

// @license-end
