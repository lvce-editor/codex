// Reused-page tests use the renderer's immediate checks rather than Playwright's
// waiting assertions. Wait for DOM mutations so deferred menus can finish rendering.
export const patchWaitingAssertions = (content) => {
  if (content.includes('const waitForTestCondition =')) {
    return content
  }
  const start = content.indexOf('const checkSingleElementCondition = async ')
  const end = content.indexOf('const checkConditionError =', start)
  if (start === -1 || end === -1) {
    throw new Error('renderer process assertion functions not found')
  }
  const implementation = `const waitForTestCondition = check => {
  return new Promise((resolve, reject) => {
    const finish = error => {
      observer.disconnect();
      clearTimeout(deadline);
      resolve({ error });
    };
    const checkCondition = () => {
      try {
        if (check()) {
          finish(false);
        }
      } catch (error) {
        observer.disconnect();
        clearTimeout(deadline);
        reject(error);
      }
    };
    const observer = new MutationObserver(checkCondition);
    const deadline = setTimeout(() => finish(true), 2000);
    observer.observe(document.documentElement, { attributes: true, characterData: true, childList: true, subtree: true });
    checkCondition();
  });
};
const checkSingleElementCondition = async (locator, fnName, options) => {
  const fn = SingleElementConditions[fnName];
  const parsedSelector = getParsedSelector(locator);
  return waitForTestCondition(() => {
    const element = querySelectorOne(parsedSelector);
    return element && fn(element, options);
  });
};
const checkMultiElementCondition = async (locator, fnName, options) => {
  const fn = MultiElementConditions[fnName];
  const parsedSelector = getParsedSelector(locator);
  return waitForTestCondition(() => fn(querySelector(parsedSelector), options));
};
`
  return content.slice(0, start) + implementation + content.slice(end)
}
