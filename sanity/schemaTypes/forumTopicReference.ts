import {defineField, defineType} from 'sanity'

export const forumTopicReference = defineType({
  name: 'forumTopicReference',
  title: 'Forum Topic Reference',
  type: 'object',
  description:
    'Editorial connection to one Discourse topic. Store only the durable numeric topic ID; live metadata remains owned by Discourse.',
  fields: [
    defineField({
      name: 'topicId',
      title: 'Discourse Topic ID',
      type: 'number',
      description:
        'The positive numeric topic ID from Discourse. Do not enter a URL, reply count, status, username, post content, or credential.',
      validation: (rule) =>
        rule.required().integer().positive().error('Enter a positive Discourse topic ID.'),
    }),
    defineField({
      name: 'editorialLabel',
      title: 'Internal Editorial Label',
      type: 'string',
      description:
        'Optional internal note that helps editors recognize the topic. This is not public Forum content.',
      validation: (rule) => rule.max(160),
    }),
  ],
  preview: {
    select: {
      topicId: 'topicId',
      editorialLabel: 'editorialLabel',
    },
    prepare({topicId, editorialLabel}) {
      return {
        title: editorialLabel || `Discourse topic ${topicId ?? 'not set'}`,
        subtitle: topicId ? `Topic ID ${topicId}` : 'Missing topic ID',
      }
    },
  },
})
