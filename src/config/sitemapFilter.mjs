// Pages kept out of the sitemap: the root redirect, translation tools, APIs, the dev-only
// fixtures, draft preview, and the submission forms.
export const isSitemapPage = (page) => {
  const pathname = new URL(page).pathname;

  return (
    pathname !== "/" &&
    pathname !== "/news-sitemap.xml" &&
    !/^\/(ne|nb)\/(search\/?|search-index\.json)$/.test(pathname) &&
    !/^\/(translations|api|dev|preview)(\/|$)/.test(pathname) &&
    !/\/(directory|events)\/submit\/?$/.test(page)
  );
};
