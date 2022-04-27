var base = require( '@stdlib/dist-stats-base-dists-flat' ).base;

// Box-Mueller, modified from https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
function randn_bm(n, mu, sigma) {
    // n = number of random numbers to sample
    // mu = mean
    // sigma = stddev

    console.log({n, mu, sigma})

    let data = []

    for (let i=0; i<n; i++) {
        var u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        let randn = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v ) 

        data.push(randn * sigma + mu);
    }

    return data
}

function sum(arr) {
    let total = 0
    for (let i=0; i<arr.length; i++) {
        total += arr[i]
    }

    return total
}

function mean(arr) {
    return sum(arr) / arr.length
}

function computeVariance(arr) {
    let arr2 = []
    let arrMean = mean(arr)
    for (let i=0; i<arr.length; i++) {
        arr2.push((arr[i] - arrMean)**2)
    }

    return mean(arr2)
}

// Random draws from a normal distribution
// Points are adjusted so that sample means and standard deviations match the population
export function randn_adj(n, mu, sigma) {
    let sample = randn_bm(n, mu, sigma)

    let sampleMean = mean(sample)
    let sampleVariance = computeVariance(sample)

    let sampleAdj = []

    for (let i=0; i<sample.length; i++) {
        sampleAdj.push((sample[i] - sampleMean)/Math.sqrt(sampleVariance) * sigma + mu)
    }

    return sampleAdj
}

export function round100(x) {
    return Math.round(x * 100)/100
}

export function computeProbOfSuperiority(scenario) {
    let {mu1, mu2, variance1, variance2} = scenario
    let mu = mu2 - mu1
    let variance = variance1 + variance2
    let psup = base.dists.normal.cdf(0, mu, Math.sqrt(variance))

    return psup
}

export const rbinom = (p, n) => {
    let outcome = 0
    for (let i = 0; i<n; i++) {
        if (Math.random() < p) {
            outcome += 1
        }
    }

    return outcome
}

const generateScenario = () => {
    /* This is not used for "yoking" */
    let mu1 = round100(Math.random() * 3)
    let mu2 = round100(Math.random() * 3)
    let tempMax = Math.max(mu1, mu2)
    let tempMin = Math.min(mu1, mu2)
    mu1 = tempMax
    mu2 = tempMin

    let variance1 = round100(0.5 + Math.random() * 1.5)
    let variance2 = round100(0.5 + Math.random() * 1.5)

    let nSize = Math.round(Math.random() * 300) + 100
    let n1 = rbinom(0.5, nSize)
    let n2 = nSize - n1

    let scenario = {
        mu1, mu2, variance1, variance2, n1, n2
    }

    scenario['probOfSuperiority'] = round100(computeProbOfSuperiority(scenario))

    return scenario
}

export const generateScenarioWithPsupInRange = (minPsup, maxPsup) => {
    let scenario = generateScenario()
    while ((scenario.probOfSuperiority < minPsup) || (scenario.probOfSuperiority > maxPsup)) {
        scenario = generateScenario()
    }

    return scenario
}

export const browserFingerprintGuid = () => {
    let nav = window.navigator;
    let screen = window.screen;
    let guid = nav.mimeTypes.length;
    guid += nav.userAgent.replace(/\D+/g, '');
    guid += nav.plugins.length;
    guid += screen.height || '';
    guid += screen.width || '';
    guid += screen.pixelDepth || '';

    return guid;
}

// from https://stackoverflow.com/a/2117523
export const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}