import puppeteer, { Page } from "puppeteer";

export class Browser {
    private linksCached = new Set();
    public allLinks: string[] = [];
    public pages: Object[] = [];

    private async getAllLinksOfPage(page: Page) {
        const links = await page.$$eval('a', (anchors) => {
            return anchors.map((a) => a.href);
        });

        return links;
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
    private async getTermInPage(page: Page, term: string, link: string) {

        const contentPage = await page.content();
        const regexForRemoveTags = /(<([^>]+)>)/ig;
        const contentWithOutTag = contentPage.replace(regexForRemoveTags, '');
        const content = contentWithOutTag?.replace(/^\s+/gm, '')?.match(new RegExp(`.{0,20}\\b${term}\\b.{0,20}`, 'gim'));


        const removedNull = content?.filter(item => item !== null);
        if (removedNull?.length === 0) {
            return null;
        }


        return removedNull;


    }
    private async getAmountApparitionOfTermInPage(page: Page, term: string) {

        const tags = await page.$$('body *:not(script)');
        const textsInsideTag = await page.content();
        const content = textsInsideTag.trim()

        const amountApparition = content?.replace(/^\s+/gm, '')?.match(new RegExp(`\\b${term}\\b`, 'gim'))?.length;
        return amountApparition;




    }


    getAmountLink(url: string) {
        return this.allLinks.filter(link => link === url).length;
    }

    async search(url: string, term: string, depth: number) {

        this.linksCached.add(url)

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);


        const size = await this.getAmountApparitionOfTermInPage(page, term);
        const termInPage = await this.getTermInPage(page, term, url);
        const hasSemantic = await this.verifyIfPageHasSemantic(page);
        if (termInPage !== null) {
            this.pages.push({ link: url, content: termInPage, size, hasSemantic })
        }

        if (depth !== 0) {
            const links = await this.getAllLinksOfPage(page)
            for (let i = 0; i < links.length; i++) {
                let currentLink = links[i]
                links.forEach(link => this.allLinks.push(link))


                if (!this.linksCached.has(currentLink)) {
                    await this.search(currentLink, term, depth - 1);
                }

            }



        }
        await browser.close();
    }

}



