import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export class ReservationService {
  private dynamoClient: DynamoDBClient;
  private sqsClient: SQSClient;
  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.sqsClient = new SQSClient({});
  }

  async reserveEmail(project: {
    title: string;
    url: string;
    topics?: string[];
  }) {
    let subscribers: string[] = [];
    if (!project.topics) {
      const allSubscribers = await this.getAllSubscribers();
      subscribers = allSubscribers;
    } else {
      const allTopicSubscribers = await this.getAllTopicSubscribers();
      const topicSubscribers = await this.getSubscribersByTopic(project.topics);

      subscribers = [...new Set([...topicSubscribers, ...allTopicSubscribers])];
    }
    for (const email of subscribers) {
      const messageBody = {
        email,
        project,
      };
      const command = new SendMessageCommand({
        QueueUrl: process.env.SQS_URL,
        MessageBody: JSON.stringify(messageBody),
      });

      await this.sqsClient.send(command);
    }
  }

  async getSubscribersByTopic(topics: string[]) {
    const filterExpressions = topics.map(
      (_, index) => `contains(topics, :topic${index})`
    );
    const filterExpression = filterExpressions.join(' or ');

    const expressionAttributeValues = topics.reduce((acc, topic, index) => {
      acc[`:topic${index}`] = topic;
      return acc;
    }, {} as Record<string, string>);

    const command = new ScanCommand({
      TableName: 'subscription',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const result = await this.dynamoClient.send(command);
    const subscriptionList = result.Items as SubscriptionInfo[];
    return subscriptionList.map((subscription) => subscription.email);
  }

  async getAllTopicSubscribers() {
    const command = new ScanCommand({
      TableName: 'subscription',
      FilterExpression: 'attribute_not_exists(topics) OR size(topics) = :empty',
      ExpressionAttributeValues: {
        ':empty': 0,
      },
    });

    const result = await this.dynamoClient.send(command);
    const subscriptionList = result.Items as SubscriptionInfo[];
    return subscriptionList.map((subscription) => subscription.email);
  }

  async getAllSubscribers() {
    const command = new ScanCommand({
      TableName: 'subscription',
    });

    const result = await this.dynamoClient.send(command);
    const subscriptionList = result.Items as SubscriptionInfo[];
    return subscriptionList.map((subscription) => subscription.email);
  }
}

type SubscriptionInfo = {
  email: string;
  topics: string[];
};
