import { Page } from "puppeteer";

export interface IPageProps {
    link: string,
    content: string,
    hasH1: boolean,
    hasSemantic: boolean,

}
export class Guugri {
    private linksCached = new Set();
    private allLinks: string[] = [];
    public pages: IPageProps[] = [];
    private _page: Page;
    constructor(
        page: Page
    ) {
        this._page = page;
    }

    async search(url: string, term: string, depth: number) {
        this.linksCached.add(url)

        console.log(`searching in ${url}`)

        await this._page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        this._page.setDefaultNavigationTimeout(0)

        const termInPage = await this._getTermInPage(this._page, term);
        const hasH1 = await this._verifyIfPageHasH1(this._page);
        const hasSemantic = await this._verifyIfPageHasSemantic(this._page);

        if (termInPage !== null) {
            this.pages.push({ link: url, content: termInPage, hasH1, hasSemantic })
        }

        if (depth !== 0) {
            const links = await this._getAllLinksOfPage(this._page, url)
            const filteredLinks = links.filter((link) => link !== url)
            this.allLinks.push(...filteredLinks)
            for (let i = 0; i < links.length; i++) {
                let currentLink = links[i]

                if (!this.linksCached.has(currentLink)) {
                    try {
                        await this.search(currentLink, term, depth - 1);
                    } catch (err) {
                        return
                    }
                }

            }

        }
    }


    private async _getTermInPage(page: Page, term: string) {

        const contentPage = await page.content();
        const regexForRemoveTags = /(<([^>]+)>)/ig;
        const contentWithoutTag = contentPage.replace(regexForRemoveTags, '');
        const content = contentWithoutTag?.replace(/^\s+/gm, '')?.match(new RegExp(`.{0,20}\\b${term}\\b.{0,20}`, 'gim'));

        const contentRemovedNull = content?.filter(item => item !== null).join(" ----> ");

        if (contentRemovedNull?.length === undefined || contentRemovedNull.trim().length === 0) {
            return null;
        }

        return contentRemovedNull

    }
    private async _verifyIfPageHasH1(page: Page) {
        const hasH1 = await page.evaluate(() => {
            return document.querySelector('h1') !== null;
        });

        return hasH1;

    }
    private async _verifyIfPageHasSemantic(page: Page) {
        const hasHeader = await page.evaluate(() => {
            return document.querySelector('header') !== null;
        });
        const hasMain = await page.evaluate(() => {
            return document.querySelector('main') !== null;
        });
        const hasFooter = await page.evaluate(() => {
            return document.querySelector('footer') !== null;
        });
        const hasSemantic = hasFooter && hasHeader && hasMain
        if (hasSemantic) {
            return true;
        } else {
            return false;
        }
    }

    private async _getAllLinksOfPage(page: Page, url: string) {
        const links = await page.$$eval('a', (link) => {
            return link.map((a) => a.href);
        });

        const regexDomain = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/i;

        const domain = url?.match(regexDomain)![1];

        /*  const removeLinkExternal = links.filter(link => {
             return link.includes('facebook') || link.includes("google") || link.includes("twitter")
         }); */

        const linksOnlyOfDomain = links.filter(link => {
            return link.includes(domain)
        });

        return linksOnlyOfDomain;
    }
    private _getOccursOfLinks() {
        const occursOfLinks = this.pages.map((item: any) => {
            const reference_amount = this.allLinks.filter(link => item.link === link).length;
            return {
                reference_amount: reference_amount,
                ...item
            }
        })
        return occursOfLinks;
    }

    getPageWithScore() {
        const occursOfLinks = this._getOccursOfLinks();
        const scorePage = occursOfLinks.map(item => {
            const hasSemantic = item.hasSemantic ? 0 : -1
            const hasH1 = item.hasH1 ? 2 : 0
            return {
                score: item.reference_amount + hasSemantic + hasH1,
                content: item.content,
                link: item.link,

                ...item,
            }
        })
        return scorePage.sort(this._compare)
    }

    private _compare(a: any, b: any) {
        if (a.score < b.score) {
            return 1;
        }
        if (a.score > b.score) {
            return -1;
        }
        return 0;
    }

    clearAll() {
        this.allLinks = []
        this.pages = []
        this.linksCached = new Set()
    }

}



