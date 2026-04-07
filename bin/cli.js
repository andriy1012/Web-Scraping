#!/usr/bin/env node

import { Command } from 'commander';
import { Scrapling } from '../src/index.js';
import chalk from 'chalk';
import ora from 'ora';
import figlet from 'figlet';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Banner
const banner = figlet.textSync('Webscrapling', {
  font: 'Slant',
  horizontalLayout: 'default'
});

program
  .name('webscrapling')
  .description('Advanced Web Scraping CLI Tool')
  .version('1.0.0');

program
  .command('scrape <url>')
  .description('Scrape a single URL')
  .option('-o, --output <file>', 'Output file (JSON)')
  .option('-s, --selector <selector>', 'CSS selector to extract')
  .option('-a, --attribute <attr>', 'Attribute to extract (text, href, src, etc.)')
  .option('-m, --multiple', 'Extract multiple elements')
  .option('-b, --browser', 'Use browser automation')
  .option('-p, --proxy <proxy>', 'Proxy server')
  .option('-d, --delay <ms>', 'Request delay in ms', '1000')
  .option('-r, --retries <number>', 'Max retries', '3')
  .option('--headless', 'Browser headless mode', true)
  .option('--no-headless', 'Show browser window')
  .option('--stealth', 'Enable stealth mode')
  .action(async (url, options) => {
    console.log(chalk.cyan(banner));
    console.log();

    const spinner = ora('Initializing scraper...').start();

    try {
      const scraper = new Scrapling({
        useBrowser: options.browser || false,
        headless: options.headless,
        proxies: options.proxy ? [options.proxy] : [],
        requestDelay: parseInt(options.delay),
        maxRetries: parseInt(options.retries)
      });

      await scraper.init();
      spinner.succeed('Scraper initialized');

      const extractRules = {};
      if (options.selector) {
        extractRules.data = {
          selector: options.selector,
          attr: options.attribute || 'text',
          multiple: options.multiple || false
        };
      }

      spinner.text = `Scraping ${url}...`;
      spinner.start();

      const result = await scraper.scrape(url, extractRules);

      spinner.succeed(`Successfully scraped ${url}`);
      console.log();
      console.log(chalk.green('Status Code:'), result.statusCode);
      console.log(chalk.green('Timestamp:'), new Date(result.timestamp).toISOString());
      
      if (result.data) {
        console.log();
        console.log(chalk.cyan('Extracted Data:'));
        console.log(JSON.stringify(result.data, null, 2));
      }

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(result, null, 2));
        console.log();
        console.log(chalk.green(`Results saved to: ${options.output}`));
      }

      await scraper.close();
    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('crawl <url>')
  .description('Crawl website with depth limit')
  .option('-o, --output <file>', 'Output file (JSON)')
  .option('-d, --depth <number>', 'Max crawl depth', '2')
  .option('-m, --max-pages <number>', 'Max pages to crawl', '50')
  .option('-s, --selector <selector>', 'CSS selector for links')
  .option('--same-domain', 'Stay within same domain', true)
  .option('-p, --proxy <proxy>', 'Proxy server')
  .action(async (url, options) => {
    console.log(chalk.cyan(banner));
    console.log();

    const spinner = ora('Initializing crawler...').start();

    try {
      const scraper = new Scrapling({
        useBrowser: false,
        proxies: options.proxy ? [options.proxy] : [],
        requestDelay: 1000
      });

      await scraper.init();
      spinner.succeed('Crawler initialized');

      spinner.text = `Crawling ${url} (depth: ${options.depth})...`;
      spinner.start();

      const results = await scraper.crawl(url, {}, {
        maxDepth: parseInt(options.depth),
        maxPages: parseInt(options.maxPages),
        sameDomain: options.sameDomain,
        linkSelector: options.selector || 'a[href]'
      });

      spinner.succeed(`Crawled ${results.length} pages`);
      console.log();
      console.log(chalk.green(`Total pages: ${results.length}`));

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(results, null, 2));
        console.log(chalk.green(`Results saved to: ${options.output}`));
      }

      await scraper.close();
    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('screenshot <url>')
  .description('Take screenshot of webpage')
  .option('-o, --output <file>', 'Output file (PNG)')
  .option('-f, --full-page', 'Full page screenshot')
  .option('-p, --proxy <proxy>', 'Proxy server')
  .option('--headless', 'Browser headless mode', true)
  .option('--no-headless', 'Show browser window')
  .action(async (url, options) => {
    console.log(chalk.cyan(banner));
    console.log();

    const spinner = ora('Launching browser...').start();

    try {
      const scraper = new Scrapling({
        useBrowser: true,
        headless: options.headless,
        proxies: options.proxy ? [options.proxy] : []
      });

      await scraper.init();
      spinner.succeed('Browser launched');

      spinner.text = `Navigating to ${url}...`;
      spinner.start();

      const screenshot = await scraper.screenshot(url, {
        fullPage: options.fullPage || false
      });

      spinner.succeed('Screenshot captured');

      const outputFile = options.output || 'screenshot.png';
      writeFileSync(outputFile, screenshot);
      
      console.log();
      console.log(chalk.green(`Screenshot saved to: ${outputFile}`));

      await scraper.close();
    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('evaluate <url> <script>')
  .description('Execute JavaScript on webpage')
  .option('-p, --proxy <proxy>', 'Proxy server')
  .option('--headless', 'Browser headless mode', true)
  .action(async (url, script, options) => {
    console.log(chalk.cyan(banner));
    console.log();

    const spinner = ora('Launching browser...').start();

    try {
      const scraper = new Scrapling({
        useBrowser: true,
        headless: options.headless,
        proxies: options.proxy ? [options.proxy] : []
      });

      await scraper.init();
      spinner.succeed('Browser launched');

      spinner.text = `Executing script on ${url}...`;
      spinner.start();

      const result = await scraper.evaluate(url, script);

      spinner.succeed('Script executed');
      console.log();
      console.log(chalk.cyan('Result:'));
      console.log(JSON.stringify(result, null, 2));

      await scraper.close();
    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('batch <file>')
  .description('Scrape multiple URLs from file')
  .option('-o, --output <file>', 'Output file (JSON)')
  .option('-s, --selector <selector>', 'CSS selector to extract')
  .option('-a, --attribute <attr>', 'Attribute to extract')
  .option('-c, --concurrency <number>', 'Concurrency limit', '5')
  .option('-p, --proxy <proxy>', 'Proxy server (comma separated)')
  .option('-d, --delay <ms>', 'Request delay in ms', '1000')
  .action(async (file, options) => {
    console.log(chalk.cyan(banner));
    console.log();

    const { readFileSync } = await import('fs');
    
    try {
      const content = readFileSync(file, 'utf-8');
      const urls = content.split('\n').filter(line => line.trim().startsWith('http'));

      if (urls.length === 0) {
        console.log(chalk.red('No valid URLs found in file'));
        process.exit(1);
      }

      console.log(chalk.green(`Found ${urls.length} URLs to scrape`));
      console.log();

      const spinner = ora('Initializing scraper...').start();

      const scraper = new Scrapling({
        useBrowser: false,
        proxies: options.proxy ? options.proxy.split(',') : [],
        requestDelay: parseInt(options.delay)
      });

      await scraper.init();
      spinner.succeed('Scraper initialized');

      const extractRules = {};
      if (options.selector) {
        extractRules.data = {
          selector: options.selector,
          attr: options.attribute || 'text',
          multiple: true
        };
      }

      spinner.text = `Scraping ${urls.length} URLs...`;
      spinner.start();

      const results = await scraper.scrapeBatch(urls, extractRules, parseInt(options.concurrency));

      spinner.succeed(`Scraped ${results.length} URLs`);

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(results, null, 2));
        console.log(chalk.green(`Results saved to: ${options.output}`));
      }

      await scraper.close();
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('proxies <file>')
  .description('Test proxy list from file')
  .option('-t, --target <url>', 'Target URL to test', 'https://httpbin.org/ip')
  .option('-o, --output <file>', 'Output file (JSON)')
  .action(async (file, options) => {
    console.log(chalk.cyan(banner));
    console.log();

    const { readFileSync } = await import('fs');
    
    try {
      const content = readFileSync(file, 'utf-8');
      const proxies = content.split('\n').filter(line => line.trim());

      if (proxies.length === 0) {
        console.log(chalk.red('No proxies found in file'));
        process.exit(1);
      }

      console.log(chalk.green(`Testing ${proxies.length} proxies...`));
      console.log();

      const results = [];
      
      for (const proxy of proxies) {
        process.stdout.write(`Testing ${proxy}... `);
        
        try {
          const scraper = new Scrapling({
            proxies: [proxy],
            requestDelay: 0
          });

          await scraper.init();
          const result = await scraper.scrape(options.target);
          
          if (result.statusCode === 200) {
            console.log(chalk.green('✓ Working'));
            results.push({ proxy, status: 'working', statusCode: result.statusCode });
          } else {
            console.log(chalk.yellow(`✗ Status: ${result.statusCode}`));
            results.push({ proxy, status: 'error', statusCode: result.statusCode });
          }

          await scraper.close();
        } catch (error) {
          console.log(chalk.red(`✗ ${error.message}`));
          results.push({ proxy, status: 'failed', error: error.message });
        }
      }

      const working = results.filter(r => r.status === 'working').length;
      console.log();
      console.log(chalk.green(`Working: ${working}/${proxies.length}`));

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(results, null, 2));
        console.log(chalk.green(`Results saved to: ${options.output}`));
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
