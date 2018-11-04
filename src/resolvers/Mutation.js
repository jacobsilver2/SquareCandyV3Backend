const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
// this takes callback-based functions and turns them into promise-based functions.  This is a stock utility from Node.
const { promisify } = require('util');

const Mutations = {
    async createItem(parent, args, ctx, info) {
        // Todo: check if they are logged in
        const item = await ctx.db.mutation.createItem({
            data: {...args}
        }, info)
        return item;
    },

    updateItem(parent, args, ctx, info) {
        // take a copy of the updates
        const updates = {...args}
        // remove the ID from the updates (we don't want to update the ID ever)
        delete updates.id;
        // run the update method
        return ctx.db.mutation.updateItem({
            data: updates,
            where: {
                id: args.id
            },
        }, info);
    },

    async deleteItem(parent, args, ctx, info) {
        const where = {id: args.id };
        //1. Find the item
        const item = await ctx.db.query.item({ where }, `{ id title}`);
        //2. Check if they own the item or have permissions
        //Todo
        //3. Delete it
        return ctx.db.mutation.deleteItem({ where }, info);
    },
    
    async signup(parent, args, ctx, info) {
        // lower case their email
        args.email = args.email.toLowerCase();
        // hash their password
        const password = await bcrypt.hash(args.password, 10);
        // create the user in the db
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: { set: ['USER'] },
            },
        }, info);
        // create the JWT for them (this is so you are automatically logged in after you sign up)
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
        // we set the jwt as a cookie on the response
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });
        // return the user to the browser
        return user;
    },

    async signin(parent, { email, password }, ctx, info) {
        // 1. Check to see if there is a user with that email
        const user = await ctx.db.query.user({ where: { email }});

        if (!user) {
            throw new Error(`No user found for email: ${email}`);
        }
        
        // 2. Check if their password is correct
        // its important to use bcrypt for this because it needs to hash the incoming password and compare it against the
        // already hashed password
        const valid = bcrypt.compare(password, user.password);
        if (!valid) {
            throw new Error('Invalid password');
        }

        // 3. Generate the JWT Token
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

        // 4. Set the cookie with the token
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });

        // 5. Return the User
        return user;
    },

    signout(parent, args, ctx, info){
        // clearCookie comes from the cookieParser middleware
        ctx.response.clearCookie('token');
        return { message: 'Goodbye'};
    },

    async requestReset(parent, args, ctx, info){
        // Check if this is a real User
        const user = await ctx.db.query.user({ where: {email: args.email} });
        if (!user){
            throw new Error(`No user found for email: ${args.email}`);
        }
        // Set a reset token and expiry on that user
        const randomBytesPromisified = promisify(randomBytes);
        const resetToken = (await randomBytesPromisified(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; //1 hour from now
        const res = await ctx.db.mutation.updateUser({
            where: {email: args.email},
            data: { resetToken, resetTokenExpiry }
        })
        console.log(res);
        return {message: "thanks bub"};
        // Email them that reset token
    },

    async resetPassword(parent, args, ctx, info){
        // 1. Check if the passwords match
        if (args.password !== args.confirmPassword) {
            throw new Error('Passwords don\'t match bub');
        }
        // 2. Check if it's a legit reset token
        // 3. Check if it's expiried
        // steps 2 and 3 can be done in one step
        
        // querying for users instead of user gives us many more search options.
        // first we query for the reset token, second we make sure the expiry is within one hour
        const [user] = await ctx.db.query.users({
            where: {
                resetToken: args.resetToken,
                resetTokenExpiry_gte: Date.now() - 3600000
            },
        });
        if(!user){
            throw new Error('this token is either invalid or expired');
        }
        
        // 4. Hash their new passwords
        const password  = await bcrypt.hash(args.password, 10);

        // 5. Save the new password to the user and remove old reset token fields
        const updatedUser = await ctx.db.mutation.updateUser({
            where: {email: user.email},
            data: {
                password,
                resetToken: null,
                resetTokenExpiry: null
            }
        })
        // 6. Generate JWT
        const token = jwt.sign({ userId: updatedUser.id}, process.env.APP_SECRET);
        // 7.  Set the JWT Cookie
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365
        })
        // 8. return the new User
        return updatedUser;
    }
};

module.exports = Mutations;
