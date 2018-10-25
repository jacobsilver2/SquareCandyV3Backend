const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        // create the JWT for them
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
        // we set the jwt as a cookie on the response
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });
        // return the user to the browser
        return user;
    }
};

module.exports = Mutations;
