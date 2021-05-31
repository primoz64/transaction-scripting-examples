import { By, Key } from 'selenium-webdriver';
import { driver, test } from 'thousandeyes';

runScript();

async function runScript() {
    
    await configureDriver();

    // Load page
    await driver.get('https://cisco.com'); 

    // Keep clicking 'Products' every 100ms until 'cdc-nav' element is present.
    await keepClickingUntilPresent(By.name(`Products`), By.css(`cdc-nav`));
    
}

// Sometimes button doesn't work right away because its action is attached to it via JavaScript with a small delay.
// In such a case keepClickingUntilPresent() comes handy. It keeps clicking the clickElementSelector every 100ms
// until presentElementSelector is found. presentElementSelector should be an element that shows up after the button
// click is succesful.
async function keepClickingUntilPresent(clickElementSelector, presentElementSelector) {
    let configuredTimeouts = await driver.manage().getTimeouts();
    let implicitTimeout = configuredTimeouts.implicit;
    let attemptEndTime = Date.now() + implicitTimeout;
    await driver.manage().setTimeouts({ implicit: 100 });
    let lastError;
    while (Date.now() < attemptEndTime) {
        try {
            await click(clickElementSelector);
        } catch (e) {
            lastError = e;
        }
        try {
            await driver.findElement(presentElementSelector);
            await driver.manage().setTimeouts({ implicit: implicitTimeout });
            return;
        } catch (e) {
            lastError = e;
        }
    }
    await driver.manage().setTimeouts({ implicit: implicitTimeout });
    throw lastError;
}

async function configureDriver() {
    await driver.manage().setTimeouts({
        implicit: 7 * 1000, // If an element is not found, reattempt for this many milliseconds
    });
}

async function click(selector) {
    const configuredTimeouts = await driver.manage().getTimeouts();
    const clickAttemptEndTime = Date.now() + configuredTimeouts.implicit;

    await reattemptUntil(attemptToClick, clickAttemptEndTime);
    
    async function attemptToClick() {
        await driver.findElement(selector).click();
    }
}

async function reattemptUntil(attemptActionFn, attemptEndTime) {
    const TIME_BETWEEN_ATTEMPTS = 100;
    let numberOfAttempts = 0;
    let attemptError;
    while (Date.now() < attemptEndTime || numberOfAttempts === 0) {
        try {
            numberOfAttempts += 1;
            await attemptActionFn();
        }
        catch (error) {
            attemptError = error;
            await driver.sleep(TIME_BETWEEN_ATTEMPTS);
            continue; // Attempt failed, reattempt
        }
        attemptError = null;
        break; // Attempt succeeded, stop attempting
    }

    const wasAttemptSuccessful = !attemptError;
    if (!wasAttemptSuccessful) {
        throw attemptError;
    }
}