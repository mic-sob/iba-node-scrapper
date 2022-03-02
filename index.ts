import axios from "axios";
import { load } from "cheerio";
import * as fs from "fs";

type Cocktail = { 
  name: string | null;
  ingredients: string[] | undefined;
  method: string | null;
  garnish: string | null;
  imageUrl: string | undefined;
}

const IBA_COCKTAILS_ROOT = "https://iba-world.com/category/iba-cocktails/";

const log = (...data: any[]) => console.log(data);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getCocktailsLinks = async () => {
  const response = await axios.get(IBA_COCKTAILS_ROOT);
  const html = response.data;
  log("Visited cocktails root");
  const $ = load(html);

  const cocktails: string[] = [];

  $(".entry-title").each((_: number, element: any) => {
    const anchor = $(element).find("a");
    const name = anchor.html();
    const link = anchor.attr("href");

    if (name && link) {
      log(`Pushing ${link} to links array`);
      cocktails.push(link);
    }
  });

  return cocktails;
};

const fetchCocktail = async (link: string) => {
  log(`Downloading data from ${link}...`);
  const response = await axios.get(link);
  const html = response.data;
  const $ = load(html);

  const name = $(".entry-title").html();
  const paragraphs = $(".blog-post-content").find("p");
  const imageUrl = $("meta[property=\"og:image\"]").attr("content");

  const cocktailData = {
    name,
    ingredients: $(paragraphs[0]).html()?.split("<br>\n"),
    method: $(paragraphs[1]).html(),
    garnish: $(paragraphs[2]).html(),
    imageUrl,
  };

  return cocktailData;
};

const fetchCocktailsDetails = async (cocktailLinks: string[]) => {
  const details = [];
  for (const link of cocktailLinks) {
    const detail = await fetchCocktail(link);
    await sleep(400);
    details.push(detail);
    log(detail);
  }

  return details;
};

(async function () {
    const links = await getCocktailsLinks();
    const cocktailDetails = await fetchCocktailsDetails(links);
    const cocktailsJson: Cocktail[] = [];

    cocktailDetails.forEach(async (detail) => {
        cocktailsJson.push(detail);
    });

    const dataToWrite = JSON.stringify(cocktailsJson);
    fs.writeFileSync('iba.json', dataToWrite);
})()
