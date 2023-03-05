import { PrismaClient } from '@prisma/client';
import express from 'express';
import puppeteer from 'puppeteer';
import { Guugri } from './services/guugri';


const app = express()
app.use(express.json())
const prisma = new PrismaClient()

app.post('/', async (req, res) => {
    const { url, term, deep } = req.body;

    const storage = await prisma.storage.findFirst({
        where: {
            url: url, term: term, deep: deep
        },
        include: {
            pages: true
        }
    })

    if (storage) {
        return res.json({ storage })

    }

    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();

    const guugre = new Guugri(page);

    await guugre.search(url, term, deep);

    const pageWithScore = guugre.getPageWithScore()

    await prisma.storage.create({
        data: {
            deep: deep,
            url: url,
            term: term,
            pages: {
                create: pageWithScore.map(item => {
                    return {
                        score: item.score,
                        url: url,
                        content: item.content ?? ''


                    }
                }),
            }

        },
    })
    guugre.clearAll()
    browser.close();

    return res.json({ search: pageWithScore })

})

app.listen(4000, () => (`server run in http://localhost:4000`))