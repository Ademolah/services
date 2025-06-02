const mongoose = require('mongoose')
const argon2 = require('argon2')

const UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, trim: true, required: true},
    email: {type: String, unique: true, trim: true, required: true, lowercase:true},
    password: {type: String, required: true},
    createdAt: {type: Date, default: Date.now()}
}, {timestamps: true})


//hasing the password from the model
UserSchema.pre('save', async function (next){
    if(this.isModified('password')){
        try {
            this.password = await argon2.hash(this.password)
            
        } catch (error) {
            return next(error)
        }
    }
})


//compare the passwords
UserSchema.methods.comparePassword = async function(candidatePassword){
    try {
        return await argon2.verify(this.password, candidatePassword)
        
    } catch (error) {
        throw error
    }
}

//a search on the username
UserSchema.index({username: 'text'})


const User = mongoose.model('User', UserSchema);

module.exports = User