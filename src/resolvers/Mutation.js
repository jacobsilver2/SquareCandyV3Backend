const Mutations = {
    async createItem(parent, args, ctx, info) {
        // Todo: check if they are logged in
        const item = await ctx.db.mutation.createItem({
            data: {...args}
        }, info)
        return item;
    }
};

module.exports = Mutations;
