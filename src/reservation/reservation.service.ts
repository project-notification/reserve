import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export class ReservationService {
  private client: DynamoDBClient;
  constructor() {
    this.client = new DynamoDBClient({});
  }

  async reserveEmail(project: {
    title: string;
    url: string;
    topics?: string[];
  }) {
    if (!project.topics) {
      return;
    } else {
      const topicSubscribers = await this.getSubscribersByTopic(project.topics);
      const allSubscribers = await this.getAllTopicSubscribers();
      const subscribers = [
        ...new Set([...topicSubscribers, ...allSubscribers]),
      ];

      console.log(subscribers);
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

    const result = await this.client.send(command);
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

    const result = await this.client.send(command);
    const subscriptionList = result.Items as SubscriptionInfo[];
    return subscriptionList.map((subscription) => subscription.email);
  }
}

type SubscriptionInfo = {
  email: string;
  topics: string[];
};
