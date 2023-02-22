import { clientConfig } from '../clientConfig';
const platformClient = require('purecloud-platform-client-v2/dist/node/purecloud-platform-client-v2.js');
import React, { useEffect, useState } from 'react';
import  { GenesysCloudWebrtcSdk } from 'genesys-cloud-webrtc-sdk';
import { ISdkMediaState, SdkMediaStateWithType } from 'genesys-cloud-webrtc-sdk';

interface IQueue {
    id: string,
    activeUsers: number,
    onQueueUsers: number
}




const searchApi = new platformClient.SearchApi();
const usersApi = new platformClient.UsersApi();
const analyticsApi = new platformClient.AnalyticsApi();
const tokensApi = new platformClient.TokensApi();
const routingApi = new platformClient.RoutingApi();
const presenceApi = new platformClient.PresenceApi();
const OrganizationApi = new platformClient.OrganizationApi();
const ConversationApi = new platformClient.ConversationsApi();





const offlinePresenceId = 'ccf3c10a-aa2c-4845-8e8d-f59fa48c58e5';

const client = platformClient.ApiClient.instance;
client.setEnvironment(platformClient.PureCloudRegionHosts.us_west_2);
const { clientId, redirectUri} = clientConfig;

const cache: any = {};


//-------------orgsanization -----------------
export function organization()  {
    return OrganizationApi.getOrganizationsMe()
    .then((data: any) => {
      console.log(`getOrganizationsMe success! data: ${JSON.stringify(data)}`);

      return data
    })
    .catch((err: any) => {
      console.error(err);
    });
}
//--------------------------------------------


//-------------------------------testing-------------------

export function conversation()  {
    return ConversationApi.getAnalyticsConversationsDetails("hello")
    .then((data: any) => {
      console.log(`getAnalyticsConversationsDetails success! data: ${JSON.stringify(data, null, 2)}`);
      return data
    })
    .catch((err: any) => {
      console.error(err);
    });
}
//----------------------------------------------------------------------------------------------

// export function router(){
// routingApi.getRoutingAvailablemediatypes()
//   .then((data: any) => {
//     console.log("routing data ", data);
//   })
//   .catch((err: any) => {
//     console.log('There was a failure calling getRoutingAvailablemediatypes');
//     console.error(err);
//   })}
//----------------------------------------------------------------------------------------------
// export function IntegrationsAll()  {
    
//     return integrationsApi.getIntegrations()
//     .then((data: any) => {
//       console.log(`getIntegrations success! data: ${JSON.stringify(data, null, 2)}`);
//       return data
//     })
//     .catch((err: any) => {
//       console.error(err);
//     });
// }


// export function Identity()  {

//     return identityApi.getIdentityproviders()
//     .then((data: any) => {
//       console.log(`getIdentityproviders success! data: ${JSON.stringify(data, null, 2)}`);
//       return data
//     })
//     .catch((err: any) => {
//       console.error(err);
//     });
// }


export function authenticate() {
    return client.loginImplicitGrant(clientId, redirectUri, { state: 'state' })
        .then((data: any) => {
            console.log("authenticate data", data.accessToken)
            platformClient.ApiClient.instance.setAccessToken(data.accessToken);
            return data;
            
        })
        .catch((err: any) => {
            console.error(err);
        });
}



// const sdk = new GenesysCloudWebrtcSdk({})

// sdk.setAccessToken(accessToken1)
  
//   sdk.initialize().then(() => {
//   console.log("sdk is here", sdk)
//   })
//   .catch((e) => {console.log("error for sdk ",e)})
  
//   async function run () {
//   console.log("sdk.media.getState()",sdk.media.getState())
//     let mediaState: ISdkMediaState = sdk.media.getState();
//     // console.log("mediaState",mediaState)
//     sdk.media.on('state', (state: SdkMediaStateWithType) => {
//       mediaState = state;
//     });
//     console.log("mediaState",mediaState)
//     try {
//       await sdk.media.requestMediaPermissions('audio');
//       console.log("got permission")
//     } catch (e) {
//       console.log("error in accessing media  ",e)
//     }
  //   const devices = mediaState.devices;
  //   const audioDevices = mediaState.audioDevices; 
  // console.log("devices",devices)
  // console.log("audioDevices",audioDevices)
  //   const micId = audioDevices[0].deviceId;
  //   console.log("mic id is ",micId)
  //   const audioStream = await sdk.media.startMedia({ audio: micId });
  //   const sessionToAccept = { conversationId: 'some-hash-id', ...restOfSessionObject };
  //   sdk.acceptSession({
  //     conversationId: sessionToAccept.conversationid,
  //     mediaStream: audioStream
  //   });
  //   sdk.acceptSession({
  //     conversationId: sessionToAccept.conversationid,
  //     audioDeviceId: micId,
  //   });
//   }
//   run();
  


//---------------------------------------------------------

export function getUserByEmail(email: string) {
    const body = {
        pageSize: 25,
        pageNumber: 1,
        query: [{
            type: "TERM",
            fields: ["email", "name"],
            value: email
        }]
    };
    return searchApi.postUsersSearch(body);
}

export async function getQueues(userId: string, skipCache: boolean = false) {
    if (skipCache) {
        return usersApi.getUserQueues(userId);
    } else if (cache['queues']){
        return cache['queues'];
    } else {
        try {
            cache['queues'] = await usersApi.getUserQueues(userId);
            return cache['queues'];
        } catch (err) {
            console.error(err)
        }
    }
}

export function getUserRoutingStatus(userId: string) {
    return usersApi.getUserRoutingstatus(userId);
}

export function logoutUser(userId: string) {
    return Promise.all([
        tokensApi.deleteToken(userId),
        presenceApi.patchUserPresence(userId, 'PURECLOUD', {
            presenceDefinition: { id: offlinePresenceId }
        })
    ])
}

export async function logoutUsersFromQueue(queueId: string) {
    routingApi.getRoutingQueueMembers(queueId)
        .then((data: any) => {
            return Promise.all(data.entities.map((user: any) => logoutUser(user.id)));
        })
        .catch((err: any) => {
            console.error(err);
        })
}

export function getQueueObservations(queues: IQueue[]) {
    const predicates = queues.map((queue: IQueue) => {
        return {
            type: 'dimension',
            dimension: 'queueId',
            operator: 'matches',
            value: queue.id
        }
    })
    const body = {
        filter: {
           type: 'or',
           predicates
        },
        metrics: [ 'oOnQueueUsers', 'oActiveUsers' ],
    }
    return analyticsApi.postAnalyticsQueuesObservationsQuery(body);
}

export async function getUserMe(skipCache: boolean = false) {
    if (skipCache) {
        return usersApi.getUsersMe({ 
            expand: ['routingStatus', 'presence'],
        });
    } else if (cache['userMe']){
        return cache['userMe'];
    } else {
        try {
            cache['userMe'] = await usersApi.getUsersMe({ 
                expand: ['routingStatus', 'presence'],
            });
            return cache['userMe'];
        } catch (err) {
            console.error(err)
        }
    }
}

export function getUserDetails(id: string, skipCache: boolean = false) {
    if (skipCache) {
        let tempDetails: any = {};
        return usersApi.getUser(id)
            .then((userDetailsData: any) => {
                tempDetails = userDetailsData;
                return presenceApi.getUserPresence(id, 'purecloud')
            })
            .then((userPresenceData: any) => {
                tempDetails['presence'] = userPresenceData;
                return tempDetails;
            })
            .catch((err: any) => {
                console.error(err);
            });
    } else if (cache['userDetails']){
        return cache['userDetails'];
    } else {
        return usersApi.getUser(id)
            .then((userDetailsData: any) => {
                cache['userDetails'] = userDetailsData || {};
                return presenceApi.getUserPresence(id, 'purecloud')
            })
            .then((userPresenceData: any) => {
                cache['userDetails']['presence'] = userPresenceData;
                return cache['userDetails']
            })
            .catch((err: any) => {
                console.error(err);
            });
    }
  }
