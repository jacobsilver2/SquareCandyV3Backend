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
};

module.exports = Mutations;
