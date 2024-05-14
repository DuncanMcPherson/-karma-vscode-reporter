import CustomReporter = jasmine.CustomReporter;
import SuiteInfo = jasmine.JasmineStartedInfo;
import RunDetails = jasmine.JasmineDoneInfo;

interface IJasmineStart {
    total: number;
}

interface ITestStartEvent {
    title: string;
    fullTitle: string;
    currentRetry: number;
    speed: string;  
}

export interface ISuiteStartEvent {
    title: string;
    fullTitle: string;
  }
  
  export interface ISuiteFinishEvent extends ISuiteStartEvent {
    duration: number;
  }
  
  export interface ITestCompleteEvent extends ITestStartEvent {
    duration: number;
    passed: boolean;
    reason?: string;
    expected?: string;
    actual?: string;
    err?: string;
    stack?: string;
    expectedJSON?: any;
    actualJSON?: any;
    snapshotPath?: string;
  }
  
  export interface IEndEvent {
    suites: number;
    tests: number;
    passes: number;
    pending: number;
    failures: number;
    start: string /* ISO date */;
    end: string /* ISO date */;
  }
  

export const enum JasmineEvent {
    Start = 'jasmineStarted',
    SuiteStarted = "suiteStarted",
    SuiteFinished = "suiteDone",
    TestStart = 'specStarted',
    TestFinished = "specDone",
    End = 'jasmineDone',
  }
  

export type JasmineEventTuple =
  | [JasmineEvent.Start, IJasmineStart]
  | [JasmineEvent.TestStart, ITestStartEvent]
  | [JasmineEvent.SuiteStarted, ISuiteStartEvent]
  | [JasmineEvent.TestFinished, ITestCompleteEvent]
  | [JasmineEvent.SuiteFinished, ISuiteFinishEvent]
  | [JasmineEvent.End, IEndEvent];


export class KarmaVsCodeReporter implements CustomReporter {
    private start: string = "";
    private suites: jasmine.SuiteResult[] = [];
    private completedSpecs: jasmine.SpecResult[] = [];
    private pending: jasmine.SpecResult[] = [];
    private passes: jasmine.SpecResult[] = [];
    private fails: jasmine.SpecResult[] = [];

    public jasmineStarted(suiteInfo: SuiteInfo): void {
        this.start = new Date().getUTCMilliseconds().toString();
        const message: JasmineEventTuple = [JasmineEvent.Start, {total: suiteInfo.totalSpecsDefined}];
        console.log(JSON.stringify(message));
    }

    public suiteStarted(result: jasmine.SuiteResult): void {
        this.suites.push(result);
        const message: JasmineEventTuple = [JasmineEvent.SuiteStarted, {
            title: result.description,
            fullTitle: result.fullName
        }];
        console.log(JSON.stringify(message));
    }

    public specStarted(result: jasmine.SpecResult): void {
        const message: JasmineEventTuple = [JasmineEvent.TestStart, {
            title: result.description,
            fullTitle: result.fullName,
            currentRetry: 0,
            speed: result.duration?.toString()!
        }]
        console.log(JSON.stringify(message));
    }

    public specDone(result: jasmine.SpecResult): void {
        if (result.status !== "pending") {
            this.completedSpecs.push(result);
        } else {
            this.pending.push(result);
        }
        const passed = result.status === 'pending' || result.status === 'failed' ? false : true
        const message: JasmineEventTuple = [JasmineEvent.TestFinished, {
            title: result.description,
            fullTitle: result.fullName,
            currentRetry: 0,
            speed: result.duration?.toString()!,
            duration: result.duration!,
            passed: passed,
            reason: passed ? undefined : buildFailureReason(result.failedExpectations),
            expected: passed ? undefined : buildExpectations(result.failedExpectations, "expect"),
            actual: passed ? undefined : buildExpectations(result.failedExpectations, "actual")
        }];
        if (passed) {
            this.passes.push(result);
        } else if (result.status !== "pending") {
            this.fails.push(result);
        }
        console.log(JSON.stringify(message))
    }

    public suiteDone(result: jasmine.SuiteResult): void {
        const message: JasmineEventTuple = [
            JasmineEvent.SuiteFinished,
            {
                title: result.description,
                fullTitle: result.fullName,
                duration: result.duration!
            }
        ];

        console.log(JSON.stringify(message));
    }

    public jasmineDone(runDetails: RunDetails): void {
        const message: JasmineEventTuple = [
            JasmineEvent.End,
            {
                suites: this.suites.length,
                tests: this.completedSpecs.length,
                passes: this.passes.length,
                failures: this.fails.length,
                pending: this.pending.length,
                start: this.start,
                end: new Date().getUTCMilliseconds().toString()
            }
        ];

        console.log(JSON.stringify(message));
    }
}

function buildFailureReason(expectations: jasmine.FailedExpectation[]): string {
    let res = "";
    for (let i = 0; i < expectations.length; i++) {
        const expectation = expectations[i];
        res += `Expected ${expectation.actual} ${expectation.matcherName} ${expectation.expected}\n\r`
    }
    return res;
}

function buildExpectations(expects: jasmine.FailedExpectation[], actual: "actual" | "expect"): string {
    let res = "";

    for (let i = 0; i < expects.length; i++) {
        const expect = expects[i];
        res += `${actual === "actual" ? 'Received: ' : 'Expected: '}: ${actual === "actual" ? expect.actual : expect.expected}\r\n`
    }
    return res;
}
