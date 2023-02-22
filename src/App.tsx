import { 
  BrowserRouter,
  Route,
  Switch 
} from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Home } from './components/home/Home.component';
import { NavBar } from './components/navbar/NavBar.component';
import { Queues } from './components/queues/Queues.component';
import { UserSearch } from './components/user-search/UserSearch.component';
import { 
  authenticate,
  organization,
  getUserByEmail, 
  getUserMe,
 conversation
} from './utils/genesysCloudUtils';
// import { useNavigate } from "react-router-dom";
import './App.scss';
import Card from '@mui/material/Card';
import mainhead from './mainhead.png'
import { makeStyles } from '@mui/styles';
import Button from '@mui/material/Button';
import { domain } from 'process';
import { GenesysCloudWebrtcSdk } from 'genesys-cloud-webrtc-sdk';
import { ISdkMediaState, SdkMediaStateWithType } from 'genesys-cloud-webrtc-sdk';
const useStyles = makeStyles({
  root: {
    background: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    fontSize: '3vh'
  },
  image:{
    height: '30vh',
    width: '30vh',
    display: 'inline'   
  },
  card:{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    width: '25vw',
    background: 'white',
    color: 'white'
  },
  heading: {
    fontSize: '5vh'
  }
  ,text: {
    fontSize: '1vh'
  },

});


interface IUserDetails {
  images: IImage[],
  email: string,
  presence: {
    presenceDefinition: {
      systemPresence: string
    }
  }
}

interface IUser {
  results: IResult[]
}

interface IImage {
  imageUri: string
}

interface IResult {
  id: string,
  name: string
}

const stagingUrl="http://localhost:3011";   
function onVideo(domain: string,avatarUrl: string,initialized: boolean,name: string,systemPresence: string,userEmail: string,userId: string, ticketId: string,accessToken: string): void {
console.log(domain,userEmail,userId,ticketId,accessToken)
const url = `${stagingUrl}/genesys?domain=${domain}&agent=${userEmail}&user_id=${userId}&ticket_id=${ticketId}&access_Token=${accessToken}`;
//domain=${domain}&agent=${email}&user_id=${userId}&ticket_id=${ticketId}
window.location.replace(url);

return;
}


function App() {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [initialized, setInitialized] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [systemPresence, setSystemPresence] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');


  const classes = useStyles();
  useEffect(() => {
    getPlatformClientData();
    getorgs();
    // run();
    getconvos();
  }, [accessToken]);

  async function getPlatformClientData() {
    await authenticate()
      .then((data: any) => {
        console.log('AUTH', data)
        setAccessToken(data.accessToken)
        
        return getUserMe();
      })
      .then((userDetailsResponse: IUserDetails) => {
        console.log('USER ME RESPONSE', userDetailsResponse);
        const presence = userDetailsResponse.presence?.presenceDefinition?.systemPresence || '';
        const url = userDetailsResponse.images?.[userDetailsResponse.images?.length - 1]?.imageUri || '';
        const userEmail = userDetailsResponse.email || '';
        userEmail && setUserEmail(userEmail);
        url && setAvatarUrl(url);
        presence && setSystemPresence(presence);
        return getUserByEmail(userEmail);
      })
      .then((userResponse: IUser) => {
        console.log('USER', userResponse);
        const name: string = userResponse.results[0]?.name;
        name && setName(name);
        const userId: string = userResponse.results[0]?.id;
        userId && setUserId(userId);
        setInitialized(true)
        const ticketId: string = '1';
        setTicketId(ticketId)
       
      })
      .catch((err: any) => {
        console.error(err);
      });
  }
 



  async function getorgs() {
    await organization()
    .then((data:any) => {
      console.log('organization data',data)
      const domain:string = data.domain
      setDomain(data.domain)
    })
    .catch((err:any) => {
      console.log(err)
    })
  }



  async function getconvos() {
    await conversation()
    .then((data:any) => {
      console.log('conversation data',data)
     
    })
    .catch((err:any) => {
      console.log(err)
    })
  }
//------------------testing --------------------------

  
 
//   async function run () {
//     if(accessToken){
//       const sdk = new GenesysCloudWebrtcSdk({
//         accessToken: accessToken
//       });
//      console.log("sdk",sdk)
//      let mediaState: ISdkMediaState = sdk.media.getState();

//      sdk.media.on('state', (state: SdkMediaStateWithType) => {
//        mediaState = state;
//      });
   

//      try {
//        await sdk.media.requestMediaPermissions('audio');
//        const { hasMicPermissions } = sdk.media.getState();
//        console.log("hasMicPermissions",hasMicPermissions)
//      } catch (e) {
//  console.log("mediaerror",e)
//      }
   
    
//      const devices = mediaState.devices;
//      const audioDevices = mediaState.audioDevices;
//      console.log("devices",devices,"audioDevices",audioDevices)
//      /* you can request media through the sdk. if there are permissions issues, the state will be updated */
//      const micId = audioDevices[0].deviceId;
//      const audioStream = await sdk.media.startMedia({ audio: micId });
//    console.log("micId",micId)
//    console.log("audioStream",audioStream)    
//   }
//   }
  

  


//----------------------------------------------------
  console.log(domain,userEmail,userId,ticketId)
  return (

<>
<div  className={classes.root}>
  <Card className={classes.card}>
<img className={classes.image} src={mainhead}/> 
 <Button onClick={() => onVideo(domain,avatarUrl,initialized,name,systemPresence,userEmail,userId,ticketId,accessToken)} variant="contained">Start AR Genie</Button>
  </Card>

</div>


</>

    // <BrowserRouter>
    //     <NavBar/>
    //     <div className="content-wrapper">
    //       <Switch>
    //         <Route exact path='/'>
    //           { initialized && <Home avatarUrl={avatarUrl} name={name} systemPresence={systemPresence} userEmail={userEmail} userId={userId} /> }
    //         </Route>
    //         <Route path='/queues'>
    //           { initialized && <Queues userId={userId}/> }
    //         </Route>
    //         <Route path='/user-search'>
    //           { initialized && <UserSearch/> }
    //         </Route>
    //       </Switch>
    //     </div>
    // </BrowserRouter>
  );
}

export default App;










// import React from 'react'
// import { useState, useEffect } from 'react'
// import { render } from 'react-dom'
// import { ThemeProvider, DEFAULT_THEME } from '@zendeskgarden/react-theming'
// import { Button } from '@zendeskgarden/react-buttons'

// const stagingUrl="https://staging-portal.supportgenie.in";
// // const testPortalUrl="https://test-portal-v2.supportgenie.io"
// // const prodUrl="https://portal.supportgenie.io"
// // const localUrl="http://localhost:3010"

// function onVideo({client, domain, email, ticketId, userId,currentUserEmail,currentUserId}) {
//   console.log(`onVideo domain ${domain}, email ${email}, ticketId ${ticketId}, userId ${userId},currentuser ${currentUserEmail},currentuserId ${currentUserId}`)
 
//   if (domain && email && ticketId && userId) {
//     const url = `${stagingUrl}/zendesk?domain=${domain}&agent=${email}&user_id=${userId}&ticket_id=${ticketId}`;
//     console.log(url)
//     client.invoke('instances.create', {
//       location: 'modal',
//       url: url,
//       size: { // optional
//         width: '80vw',
//         height: '80vh'
//       }
//     }).then(function(modalContext) {
//       // The modal is on screen now
//       var modalClient = client.instance(modalContext['instances.create'][0].instanceGuid);
//       modalClient.on('modal.close', function() {
//       // The modal has been closed
//       });
//     });
//   }
// }


// const Main = ({client, appData}) => {
//   const [domain, setDomain] = useState();
//   const [email, setEmail] = useState();
//   const [ticketId, setTicketId] = useState();
//   const [userId, setUserId] = useState();
//   const [currentUserEmail,setCurrentUserEmail]=useState()
//   const [currentUserId,setCurrentUserId]=useState()

//   useEffect(() => {
//     if (client) {
//       client.context().then(function(context) {
//         console.log(context);
//         console.log(context.account.subdomain);
//         setDomain(context.account.subdomain);
//       })
//       client.get("currentUser").then((data)=>{
//         // console.log("email", data)
//         setCurrentUserEmail(data.currentUser.email)
//         setCurrentUserId(data.currentUser.id)
//       })
//       client.get('ticket').then(function(data) {
//         console.log('ticket data', data); // { "ticket.requester.name": "Mikkel Svane" }
//         if (data && data.ticket && data.ticket.assignee && 
//             data.ticket.assignee.user && data.ticket.assignee.user.email) {
//           setEmail(data.ticket.assignee.user.email)
//           console.log(`data.ticket.assignee.user.email`, data.ticket.assignee.user.email)
//         }
//         setTicketId(data.ticket.id)
//         console.log(`data.ticket.id`, data.ticket.id)
//         setUserId(data.ticket.requester.id)
//         console.log(`data.ticket.requester.id`, data.ticket.requester.id)
//       });
//       /*
//       client.get('ticket.assignee.user.email').then(function(data) {
//         console.log(data); // { "ticket.requester.name": "Mikkel Svane" }
//       });
//       client.get('ticket.requester').then(function(data) {
//         console.log(data); // { "ticket.requester.name": "Mikkel Svane" }
//       });
//       */
//       client.get('ticket.requester.id').then(function(data) {
//         console.log(` user id ${data['ticket.requester.id']}`, data); // { "ticket.requester.name": "Mikkel Svane" }
//       });
//       client.get('ticket.id').then(function(data) {
//         console.log(`ticket id ${data['ticket.id']}`, data); // { "ticket.requester.name": "Mikkel Svane" }
//       });
//     }
//   }, [client]);

//   return (
//     <>
//       <div>
//       <p>
//       Assist your customer using markers and guides on live video from their mobile devices.
//     </p>
//     <p>&nbsp;</p>
//     <Button onClick={() => onVideo({client, domain, email, userId, ticketId,currentUserEmail,currentUserId})} disabled={currentUserEmail!==email}>Start Remote Assistance</Button>
//     {
//       currentUserEmail!==email&& <p style={{color:"red",marginTop:'15px'}}>Please assigne ticket to yourself to access AR Genie</p>
//     }
//     </div>
//     </>
//   )
// }

// export default function App (client, appData) {
//   const container = document.querySelector('.main')
//   render(
//     <ThemeProvider theme={{ ...DEFAULT_THEME }}>
//       <Main client={client} appData={appData}/>
//     </ThemeProvider>,
//     container
//   )
// }

