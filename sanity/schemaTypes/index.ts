import {directoryListing} from './directoryListing'
import {forumCompanionAutomation} from './forumCompanionAutomation'
import {forumTopicReference} from './forumTopicReference'
import {communityEvent} from './communityEvent'
import {newsArticle} from './newsArticle'
import {norwegianTerm} from './norwegianTerm'
import {publicInformationGuide} from './publicInformationGuide'
import {publicInformationTopic} from './publicInformationTopic'

export const schemaTypes = [
  forumCompanionAutomation,
  forumTopicReference,
  newsArticle,
  communityEvent,
  directoryListing,
  publicInformationGuide,
  publicInformationTopic,
  norwegianTerm,
]
