// pages/api/nifty.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type NiftyResponse = {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number | null;
  previousClose: number;
  marketState: string;
  exchange: string;
  currency: string;
  updatedAt: string;
  source: 'live' | 'cache';
};

let lastSuccessfulData: NiftyResponse | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NiftyResponse | { error: string; cachedData?: NiftyResponse }>
) {
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/^NSEI',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.chart?.result?.length) {
      throw new Error('No valid result from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const meta = result.meta;

    const regularMarketPrice = Number(meta.regularMarketPrice);
    const previousClose = Number(meta.previousClose);
    const change = regularMarketPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    let dayHigh = Number(meta.regularMarketDayHigh ?? meta.dayHigh ?? regularMarketPrice);
    let dayLow = Number(meta.regularMarketDayLow ?? meta.dayLow ?? regularMarketPrice);

    if (result.indicators?.quote?.[0]) {
      const quote = result.indicators.quote[0];

      const highs = (quote.high || []).filter((v: number | null) => typeof v === 'number');
      const lows = (quote.low || []).filter((v: number | null) => typeof v === 'number');

      if (highs.length) dayHigh = Math.max(...highs);
      if (lows.length) dayLow = Math.min(...lows);
    }

    const payload: NiftyResponse = {
      regularMarketPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketOpen: Number(meta.regularMarketOpen ?? previousClose),
      regularMarketDayHigh: dayHigh,
      regularMarketDayLow: dayLow,
      regularMarketVolume:
        typeof meta.regularMarketVolume === 'number' ? meta.regularMarketVolume : null,
      previousClose,
      marketState: meta.marketState || 'CLOSED',
      exchange: meta.exchangeName || 'NSE',
      currency: meta.currency || 'INR',
      updatedAt: new Date().toISOString(),
      source: 'live',
    };

    lastSuccessfulData = payload;

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('Error fetching Nifty data:', error.message);

    if (lastSuccessfulData) {
      return res.status(200).json({
        ...lastSuccessfulData,
        source: 'cache',
      });
    }

    return res.status(500).json({
      error: 'Unable to fetch live Nifty data and no cached data is available.',
    });
  }
}