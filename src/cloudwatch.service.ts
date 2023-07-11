import AWS, { CloudWatchLogs } from "aws-sdk";
import Logger from "bunyan";


class CloudWatchService {
    private static instance: CloudWatchService;
    private logInitPromise: Promise<void>;

    private cloudWatchService: CloudWatchLogs;
    private logger: Logger;
    private logGroupName: string;
    private logStreamName: string;

    private constructor(logger: Logger, region: string, logGroupName: string, logStreamName: string) {
        this.logger = logger;
        this.cloudWatchService = new AWS.CloudWatchLogs({ region });
        this.logGroupName = logGroupName;
        this.logStreamName = logStreamName;

        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            });
        }

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
                .catch((error) => {
                    logger.error(`CloudWatchService logging initialization failed: ${error.toString()}`);
                    throw error;
                })
                .then(() => {
                    logger.debug('CloudWatchService initialized.');
                    return CloudWatchService.instance;
                });

        }

        return CloudWatchService.instance;
    }

    async createLogGroup(logGroupName: string): Promise<void> {
        const createLogGroupParams: AWS.CloudWatchLogs.CreateLogGroupRequest = {
            logGroupName
        };

        try {
            await this.cloudWatchService.createLogGroup(createLogGroupParams).promise();
            this.logger.debug(`Log group '${logGroupName}' created successfully.`);
        } catch (createLogGroupError) {
            if (createLogGroupError.code === 'ResourceAlreadyExistsException') {
                this.logger.debug(`Log group '${logGroupName}' already exists.`);
                return;
            }
            this.logger.warn('Error creating log group:', createLogGroupError);
            throw createLogGroupError;
        }
    }

    async createLogStream(logGroupName: string, logStreamName: string): Promise<void> {
        const createLogStreamParams: AWS.CloudWatchLogs.CreateLogStreamRequest = {
            logGroupName,
            logStreamName
        };

        try {
            await this.cloudWatchService.createLogStream(createLogStreamParams).promise();
            this.logger.debug(`Log stream '${logStreamName}' created successfully.`);
        } catch (createLogStreamError) {
            if (createLogStreamError.code === 'ResourceAlreadyExistsException') {
                this.logger.debug(`Log stream '${logStreamName}' already exists.`);
                return;
            }
            this.logger.warn('Error creating log stream:', createLogStreamError);
            throw createLogStreamError;
        }
    }

    async logToCloudWatch(logMessage: string): Promise<void> {
        const putLogEventsParams: AWS.CloudWatchLogs.PutLogEventsRequest = {
            logGroupName: this.logGroupName,
            logStreamName: this.logStreamName,
            logEvents: [
                {
                    message: logMessage,
                    timestamp: new Date().getTime()
                }
            ]
        };

        try {
            const putLogEventsResponse: AWS.CloudWatchLogs.PutLogEventsResponse = await this.cloudWatchService.putLogEvents(putLogEventsParams).promise();
            this.logger.debug('Successfully logged to CloudWatch:', putLogEventsResponse);
        } catch (putLogEventsError) {
            this.logger.error('Error logging to CloudWatch:', putLogEventsError);
            throw putLogEventsError;
        }
    }
}

export default CloudWatchService;
