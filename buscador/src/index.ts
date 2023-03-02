import express from 'express';
import { Browser } from './services/browser';


const app = express()
app.use(express.json())

app.post('/', async (req, res) => {
    const { url, term, deep } = req.body;
    const guugre = new Browser();
    await guugre.search(url, term, deep);

    const occursOfLinks = guugre.pages.map((item: any) => {
        return {
            amount: guugre.allLinks.filter(u => item.link === u).length,
            ...item
        }
    })

    const scorePage = occursOfLinks.map(item => {
        const hasSemantic = item.hasSemantic ? 0 : -1
        return {
            score: item.amount + hasSemantic + item.size,
            content: item.content,
            link: item.link,

        }
    })

    return res.json({ scorePage })



})

app.listen(4000, () => (`server run in http://localhost:4000`))