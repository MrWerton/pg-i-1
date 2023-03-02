import { PrismaClient } from '@prisma/client';
import express from 'express';
import puppeteer from 'puppeteer';
import { BrowserAdapter } from './services/browser';


const app = express()
app.use(express.json())
const prisma = new PrismaClient()

app.post('/', async (req, res) => {
    const { url, term, deep } = req.body;


    /*  const page = await prisma.storage.findFirst({
         where: {
             url: url, term: term, deep: deep
         },
         include: {
             pages: true
         }
     })
 
     if (page) {
         return res.json({ page })
 
     } */
    const guugre = new BrowserAdapter();

    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    await guugre.search(url, term, deep, browser, page);
    const occursOfLinks = guugre.pages.map((item: any) => {
        const reference_amount = guugre.allLinks.filter(link => item.link === link);
        console.log(reference_amount, "RE")
        return {
            reference_amount: reference_amount.length,
            ...item
        }
    })

    const scorePage = occursOfLinks.map(item => {
        const hasSemantic = item.hasSemantic ? 0 : -1
        const hasH1 = item.hasH1 ? 5 : 0
        return {
            score: item.reference_amount + hasSemantic + hasH1,
            content: item.content,
            link: item.link,
        }
    })
    const order = scorePage.sort(compare)

    /*  await prisma.storage.create({
         data: {
             deep: deep,
             url: url,
             term: term,
             pages: {
                 create: scorePage.map(item => {
                     return {
                         score: item.score,
                         url: url,
                         content: item.content ?? ''
 
 
                     }
                 }),
             }
 
         },
     }) */
    guugre.clearAll()
    browser.close();

    return res.json({ search: order })



})
function compare(a: any, b: any) {
    if (a.score < b.score) {
        return 1;
    }
    if (a.score > b.score) {
        return -1;
    }
    return 0;
}
app.listen(4000, () => (`server run in http://localhost:4000`))