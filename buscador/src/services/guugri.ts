import { Browser, Page } from "puppeteer";

export class Guugri {
    private linksCached = new Set();
    public allLinks: string[] = [];
    public pages: Object[] = [];

    async search(url: string, term: string, depth: number, browser: Browser, page: Page) {
        this.linksCached.add(url)

        console.log(`searching in ${url}`)

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        page.setDefaultNavigationTimeout(0)

        const hasH1 = await this.verifyIfPageHasH1(page);
        const termInPage = await this.getTermInPage(page, term);
        const hasSemantic = await this.verifyIfPageHasSemantic(page);

        if (termInPage !== null) {
            this.pages.push({ link: url, content: termInPage, hasH1, hasSemantic })
        }

        if (depth !== 0) {
            const links = await this.getAllLinksOfPage(page, url)
            const filteredLinks = links.filter((link) => link !== url)
            this.allLinks.push(...filteredLinks)
            for (let i = 0; i < links.length; i++) {
                let currentLink = links[i]

                if (!this.linksCached.has(currentLink)) {
                    try {
                        await this.search(currentLink, term, depth - 1, browser, page);
                    } catch (err) {
                        return
                    }
                }

            }

        }
    }
    private async getAllLinksOfPage(page: Page, url: string) {
        const links = await page.$$eval('a', (anchors) => {
            return anchors.map((a) => a.href);
        });

        const regexDomain = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/i;

        const domain = url?.match(regexDomain)![1];
        const linksLessCurrent = links.filter(link => {
            return link.includes(domain)
        });

        return linksLessCurrent;
    }

    private async getTermInPage(page: Page, term: string) {

        const contentPage = await page.content();
        const regexForRemoveTags = /(<([^>]+)>)/ig;
        const contentWithoutTag = contentPage.replace(regexForRemoveTags, '');
        const content = contentWithoutTag?.replace(/^\s+/gm, '')?.match(new RegExp(`.{0,20}\\b${term}\\b.{0,20}`, 'gim'));

        const removedNull = content?.filter(item => item !== null).join(" ----> ");

        if (removedNull?.length === undefined || removedNull.trim().length === 0) {
            return null;
        }

        return removedNull

    }
    private async verifyIfPageHasSemantic(page: Page) {
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
    private async verifyIfPageHasH1(page: Page) {
        const hasH1 = await page.evaluate(() => {
            return document.querySelector('h1') !== null;
        });

        return hasH1;

    }
    clearAll() {
        this.allLinks = []
        this.pages = []
        this.linksCached = new Set()
    }

}



