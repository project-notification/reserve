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
    const allSubscribers = await this.getAllTopicSubscribers();
    let subscribers: string[] = [];
    if (!project.topics) {
      subscribers = allSubscribers;
    } else {
      const topicSubscribers = await this.getSubscribersByTopic(project.topics);

      subscribers = [...new Set([...topicSubscribers, ...allSubscribers])];
    }
    console.log('title:', project.title);
    console.log('subscribers:', subscribers);
    for (const email of subscribers) {
      const command = new SendMessageCommand({
        QueueUrl: process.env.SQS_URL,
        MessageBody: JSON.stringify({
          email,
          project,
        }),
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
}

type SubscriptionInfo = {
  email: string;
  topics: string[];
};
