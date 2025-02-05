const { User } = require("../utils/mongodb.js")
const { suspension_role_id } = require("../configs/config.json")

module.exports = {
    name: "MemberJoin",
    once: false,
    async execute(member){
        const member_id = member.id
        let user = User.findOne({
            discordId: member_id
        })
        if(!user) return;
        member.roles.add(suspension_role_id);
    }
}