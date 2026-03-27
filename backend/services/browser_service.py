import asyncio
import logging
from typing import Optional, Dict
from playwright.async_api import async_playwright, Browser, Page, Playwright
import random

logger = logging.getLogger(__name__)

class BrowserService:
    def __init__(self):
        self.browsers: Dict[int, Browser] = {}
        self.playwright: Optional[Playwright] = None
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]

    async def launch_browser(self, session_number: int, ipv6: str) -> Browser:
        """Launch a new browser instance"""
        try:
            if not self.playwright:
                self.playwright = await async_playwright().start()
            
            browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    '--disable-gpu',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--window-size=1920,1080',
                ]
            )
            
            self.browsers[session_number] = browser
            logger.info(f"Browser launched for session {session_number}")
            return browser
            
        except Exception as e:
            logger.error(f"Error launching browser: {e}")
            raise

    async def close_browser(self, session_number: int) -> None:
        """Close a browser instance"""
        try:
            browser = self.browsers.get(session_number)
            if browser:
                await browser.close()
                del self.browsers[session_number]
                logger.info(f"Browser closed for session {session_number}")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")

    async def create_page(self, browser: Browser, ipv6: str) -> Page:
        """Create a new page with stealth settings"""
        try:
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent=random.choice(self.user_agents),
                locale='en-US',
                timezone_id='America/New_York'
            )
            
            page = await context.new_page()
            
            # Add stealth scripts
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)
            
            return page
            
        except Exception as e:
            logger.error(f"Error creating page: {e}")
            raise

    async def navigate_to_video(self, page: Page, video_url: str) -> Dict[str, any]:
        """Navigate to YouTube video and extract metadata"""
        try:
            await page.goto(video_url, wait_until='domcontentloaded', timeout=60000)
            await asyncio.sleep(2)
            
            # Handle cookie consent
            try:
                await page.click('button[aria-label*="Accept"]', timeout=5000)
            except:
                pass
            
            # Extract video metadata
            metadata = await page.evaluate("""
                () => {
                    const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent || 'Unknown Title';
                    const thumbnail = document.querySelector('meta[property="og:image"]')?.content || '';
                    return { title, thumbnail };
                }
            """)
            
            logger.info(f"Navigated to video: {metadata.get('title')}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error navigating to video: {e}")
            raise

    async def play_video(self, page: Page) -> None:
        """Play the video"""
        try:
            # Wait for video player
            await page.wait_for_selector('video', timeout=10000)
            
            # Click play if needed
            await page.evaluate("""
                () => {
                    const video = document.querySelector('video');
                    if (video && video.paused) {
                        video.play();
                    }
                }
            """)
            
            await asyncio.sleep(1)
            logger.info("Video playing")
            
        except Exception as e:
            logger.error(f"Error playing video: {e}")
            raise

    async def get_video_progress(self, page: Page) -> Dict[str, float]:
        """Get current video progress"""
        try:
            progress = await page.evaluate("""
                () => {
                    const video = document.querySelector('video');
                    if (!video) return { currentTime: 0, duration: 0, percentage: 0 };
                    
                    return {
                        currentTime: video.currentTime,
                        duration: video.duration || 0,
                        percentage: video.duration ? (video.currentTime / video.duration) * 100 : 0
                    };
                }
            """)
            
            return progress
            
        except Exception as e:
            logger.error(f"Error getting video progress: {e}")
            return {'currentTime': 0, 'duration': 0, 'percentage': 0}

    async def pause_video(self, page: Page) -> None:
        """Pause the video"""
        try:
            await page.evaluate("""
                () => {
                    const video = document.querySelector('video');
                    if (video) video.pause();
                }
            """)
            logger.info("Video paused")
        except Exception as e:
            logger.error(f"Error pausing video: {e}")

    async def resume_video(self, page: Page) -> None:
        """Resume the video"""
        try:
            await page.evaluate("""
                () => {
                    const video = document.querySelector('video');
                    if (video) video.play();
                }
            """)
            logger.info("Video resumed")
        except Exception as e:
            logger.error(f"Error resuming video: {e}")

    async def cleanup(self) -> None:
        """Cleanup all browsers"""
        try:
            for session_number in list(self.browsers.keys()):
                await self.close_browser(session_number)
            
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
                
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
