import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import Chat from './chat/chat';
import CurrentUsers from './current-users';
import Leaderboard from './leaderboard';
import RoomMenu from './room-menu';
import firebase from 'firebase/app';

class Lobby extends Component {

    constructor(){
        super();
        this.state = {
            messages: [],
            users: {},
            user:{},
            leaderboard: [],
            pokemonLeaderboard: [],
            mythicalPokemonLeaderboard: [],
            typesLeaderboard: [],
            threeStarsLeaderboard: [],
            botEloLeaderboard: [],
            playerEloLeaderboard: [],
            currentText: '',
            allRooms: [],
            logOut: false,
            preparationRoomId: ''
            
        };

        this.uid = firebase.auth().currentUser.uid;

        firebase.auth().currentUser.getIdToken().then(token =>{
            window._client.joinOrCreate('lobby', {idToken: token})
            .then(room=>{
                window._room = room;
                this.room = room;
                this.room.state.messages.onAdd = (m) => {this.setState({messages: this.room.state.messages})};
                this.room.state.messages.onRemove = (m) => {this.setState({messages: this.room.state.messages})};

                this.room.state.users.onAdd = (u) => {
                    if(u.id == this.uid){
                        this.setState({user: u});
                    }
                    this.setState({users: this.room.state.users})
                };
                this.room.state.users.onRemove = (u) => {this.setState({users: this.room.state.users})};

                this.room.state.leaderboard.onAdd = (l) => {this.setState({leaderboard: this.room.state.leaderboard})};
                this.room.state.leaderboard.onRemove = (l) => {this.setState({leaderboard: this.room.state.leaderboard})};
            
                this.room.state.botEloLeaderboard.onAdd = (e) => {this.setState({botEloLeaderboard: this.room.state.botEloLeaderboard})};
                this.room.state.botEloLeaderboard.onRemove = (e) => {this.setState({botEloLeaderboard: this.room.state.botEloLeaderboard})};

                this.room.state.playerEloLeaderboard.onAdd = (e) => {this.setState({playerEloLeaderboard: this.room.state.playerEloLeaderboard})};
                this.room.state.playerEloLeaderboard.onRemove = (e) => {this.setState({playerEloLeaderboard: this.room.state.playerEloLeaderboard})};
            
                this.room.onMessage('rooms', (rooms) => {
                    rooms.forEach(room =>{
                      if(room.name == 'room'){
                        this.setState({allRooms: this.state.allRooms.concat(room)});
                      }
                    });
                  });
              
                this.room.onMessage('+', ([roomId, room]) => {
                    if(room.name == 'room' && this._ismounted){
                        const roomIndex = this.state.allRooms.findIndex((room) => room.roomId === roomId);
                        if (roomIndex !== -1) {
                            let allRooms = [...this.state.allRooms];
                            allRooms[roomIndex] = room;
                            this.setState({allRooms: allRooms});
                        } 
                        else {
                            this.setState({allRooms: this.state.allRooms.concat(room)});
                        }
                    }
                });
            
                this.room.onMessage('-', (roomId) => {
                    if(this._ismounted){
                        const allRooms = this.state.allRooms.filter((room) => room.roomId !== roomId);
                        this.setState({allRooms: allRooms});
                    }
                });
            });
        });
    }

    handleSubmit (e) {
        e.preventDefault()
        this.sendMessage(this.state.currentText);
        this.setState({currentText: ""});
    }
    
    setCurrentText (e) {
        e.preventDefault();
        this.setState({ currentText: e.target.value });
    }

    sendMessage(payload){
        this.room.send('new-message', {'name': window._client.auth.displayName, 'payload': payload, 'avatar':this.state.user.avatar });
    }

    createRoom() {
        firebase.auth().currentUser.getIdToken().then(token =>{
            window._client.create('room', {idToken: token}).then((room) => {
                window._room = room;
                this.setState({
                    preparationRoomId: room.id
                });
                this.room.leave();
            }).catch((e) => {
              console.error('join error', e);
              alert(e);
            });
        });
      }

  render() {
      if(this.state.logOut){
        return <Redirect to="/auth" />;
      }
      else if(this.state.preparationRoomId != ''){
        return <Redirect to={{
            pathname: '/preparation/' + this.state.preparationRoomId
    }} />;
      }
      else{
        return (
            <div className="App" style={{
                display:'flex',
                justifyContent:'space-between'
            }}>
                <Leaderboard
                    infos={this.state.leaderboard}
                />
                <RoomMenu
                    allRooms={this.state.allRooms}
                    createRoom={this.createRoom.bind(this)}
                />
                <CurrentUsers
                    users={this.state.users}
                />
                <Chat 
                    messages={this.state.messages}
                    handleSubmit={this.handleSubmit.bind(this)} 
                    setCurrentText={this.setCurrentText.bind(this)}
                    currentText={this.state.currentText}
                />
            </div>
        );
      }
    }

  componentDidMount() { 
    this._ismounted = true;
  }
  
  componentWillUnmount() {
     this._ismounted = false;
  }
}
export default Lobby;
