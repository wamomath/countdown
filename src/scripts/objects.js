class Game {
    room;
    socket;

    constructor(room, socket, state){
        this.room = room
        this.socket = socket;
    }

    getTime(){
        return Date.now() + OFFSET
    }


    // TODO: abstract
    processState(state){}

    /**
     * @param {Property} property
     */
    update(property){
        this.socket.emit("roomStateUpdate", {
            room: this.room,
            identifier: property.getIdentifier(),
            data: property.getData()
        });
    }

    updateAdmin(property){
        this.socket.emit("adminRoomStateUpdate", {
            room: this.room,
            identifier: property.getIdentifier(),
            data: property.getData()
        });
    }

    // TODO: abstract
    toJSON(){}
}


class Property {
    identifier;
    data;
    game;
    lastUpdate;
    lastRender;

    constructor(game, identifier, data = null){
        this.game = game
        this.identifier = identifier
        this.data = data
    }

    render(){
        this.lastRender = this.game.getTime()

        this.renderInternal()
    }

    // TODO: abstract
    renderInternal(){}

    update(data) {
        this.data = data
        this.game.update(this)
    }

    updateExternal(data){
        this.data = data
    }

    getIdentifier(){
        return this.identifier;
    }

    getData(){
        return this.data;
    }

    toJSON(){
        return this.data;
    }
}

class AdminProperty extends Property{
    update(data) {
        this.data = data
        this.game.updateAdmin(this)
    }
}