import {
    CloudWatchLogs,
    CreateLogGroupCommand,
    CreateLogStreamCommand,
    PutLogEventsCommand,
    PutLogEventsResponse
} from "@aws-sdk/client-cloudwatch-logs";
import Logger from "bunyan";
import { CloudWatchLogsClientConfig } from "@aws-sdk/client-cloudwatch-logs/dist-types/CloudWatchLogsClient";


class CloudWatchService {
    private static instance: CloudWatchService;
    private logInitPromise: Promise<void>;

    private cloudWatchService: CloudWatchLogs;
    private logger: Logger;
    private readonly logGroupName: string;
    private readonly logStreamName: string;

    private constructor(logger: Logger, region: string, logGroupName: string, logStreamName: string) {
        this.logger = logger;
        this.logGroupName = logGroupName;
        this.logStreamName = logStreamName;

        const args: CloudWatchLogsClientConfig = { region };

        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            args.credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        }

        this.cloudWatchService = new CloudWatchLogs(args);

        this.logInitPromise = new Promise((resolve, reject) => {
            this.createLogGroup(this.logGroupName).catch(reject).then(() => {
                this.createLogStream(this.logGroupName, this.logStreamName).then(resolve).catch(reject);
            });
        });
    }

    public static init(logger: Logger, region: string, logGroupName: string, logStreamName: string): CloudWatchService {
        if (!CloudWatchService.instance) {
            CloudWatchService.instance = new CloudWatchService(logger, region, logGroupName, logStreamName);

            CloudWatchService.instance.logInitPromise
                .then(() => {
                    logger.debug('CloudWatchService initialized.');
                    return CloudWatchService.instance;
                })
                .catch((error) => {
                    logger.error(`CloudWatchService logging initialization failed: ${error.toString()}`);
                    throw error;
                });

        }

        return CloudWatchService.instance;
    }

    async createLogGroup(logGroupName: string): Promise<void> {
        const createLogGroupCommand: CreateLogGroupCommand =
            new CreateLogGroupCommand({ logGroupName });


        try {
            await this.cloudWatchService.send(createLogGroupCommand);

            this.logger.debug(`Log group '${logGroupName}' created successfully.`);
        } catch (createLogGroupError) {
            if (createLogGroupError.name === 'ResourceAlreadyExistsException') {
                this.logger.debug(`Log group '${logGroupName}' already exists.`);
                return;
            }
            this.logger.warn('Error creating log group:', createLogGroupError);
            throw createLogGroupError;
        }
    }

    async createLogStream(logGroupName: string, logStreamName: string): Promise<void> {
        const createLogStreamCommand: CreateLogStreamCommand = new CreateLogStreamCommand({
            logGroupName,
            logStreamName
        });

        try {
            await this.cloudWatchService.send(createLogStreamCommand);
            this.logger.debug(`Log stream '${logStreamName}' created successfully.`);
        } catch (createLogStreamError) {
            if (createLogStreamError.name === 'ResourceAlreadyExistsException') {
                this.logger.debug(`Log stream '${logStreamName}' already exists.`);
                return;
            }
            this.logger.warn('Error creating log stream:', createLogStreamError);
            throw createLogStreamError;
        }
    }

    async logToCloudWatch(logMessage: string): Promise<void> {
        const putLogEventsCommand: PutLogEventsCommand = new PutLogEventsCommand({
            logGroupName: this.logGroupName,
            logStreamName: this.logStreamName,
            logEvents: [
                {
                    message: logMessage,
                    timestamp: new Date().getTime()
                }
            ]
        })

        try {
            const putLogEventsResponse: PutLogEventsResponse = await this.cloudWatchService.send(putLogEventsCommand);
            this.logger.debug('Successfully logged to CloudWatch:', putLogEventsResponse);
        } catch (putLogEventsError) {
            this.logger.error('Error logging to CloudWatch:', putLogEventsError);
            throw putLogEventsError;
        }
    }
}

export default CloudWatchService;
