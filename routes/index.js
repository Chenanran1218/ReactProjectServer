var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')
const {UserModel, ChatModel} = require('../db/models')
const filter = {password: 0, __v: 0} // 指定过滤的属性 将password和_v属性从user文档中去除。过滤了

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express！ 这个title是路由传给index.jx的值' });
});

// 注册一个路由: 用户注册 routes.js文件里就是来注册我们自己的路由的 第一个注册一个路由本质是定义一个路由。 第二个用户注册是实现逻辑
/*
a)path为: /register
b)请求方式为: POST
c)接收username和password参数
d)admin是已注册用户
e)注册成功返回: {code: 0, data: {_id: 'abc', username: ‘xxx’, password:’123’}
f)注册失败返回: {code: 1, msg: '此用户已存在'}
 */
/*
1. 获取请求参数
2. 处理
3. 返回响应数据
 */



router.post('/register',function(req,res){
  const {username,password,type}=req.body
  UserModel.findOne({username},function(err,user){
    if(user){
      res.send({code:1,msg:'该用户名已注册'})
    }else{
      //注册成功了 要保存到数据库
      new UserModel({username,type,password:md5(password)}).save(function(err,user){
        res.cookie('userid',user._id,{maxAge:1000*60*60*24})
        const data={username,type,_id:user._id,password:md5(password)}
      res.send({code:0,data})
      })  
    }
  })
})

router.post('/login',function(req,res){
  const {username,password}=req.body
  // 登录返回的user文档信息中过滤掉密码 在findone(第二个参数这里使用filter)
  UserModel.findOne({username,password:md5(password)},filter,function(err,user){
    if(user){
      res.cookie('userid',user._id,{maxAge:1000*60*50})
      res.send({code:0,data:user})
    }else{
      res.send({code:1,msg:'sr，密码错误。请输入正确的密码'})
    }
  })
})

// 更新用户信息的路由
router.post('/update', function (req, res) {
  // 从请求的cookie得到userid
  const userid = req.cookies.userid
  // 如果不存在, 直接返回一个提示信息
  if(!userid) {
    return res.send({code: 1, msg: '请先登陆'})
  }
  // 存在, 根据userid更新对应的user文档数据
  // 得到提交的用户数据
  const user = req.body // 没有_id
  UserModel.findByIdAndUpdate({_id: userid}, user, function (error, oldUser) {

    if(!oldUser) {
      // 通知浏览器删除userid cookie
      res.clearCookie('userid')
      // 返回返回一个提示信息
      res.send({code: 1, msg: '请先登陆'})
    } else {
      // 准备一个返回的user数据对象
      const {_id, username, type} = oldUser
      const data = Object.assign({_id, username, type}, user)
      // 返回
      res.send({code: 0, data})
    }
  })
})

// 获取用户信息的路由(根据cookie中的userid)
router.get('/user', function (req, res) {
  // 从请求的cookie得到userid
  const userid = req.cookies.userid
  // 如果不存在, 直接返回一个提示信息
  if(!userid) {
    return res.send({code: 1, msg: '请先登陆'})
  }
  // 根据userid查询对应的user
  UserModel.findOne({_id: userid}, filter, function (error, user) {
    if(user) {
      res.send({code: 0, data: user})
    } else {
      // 通知浏览器删除userid cookie
      res.clearCookie('userid')
      res.send({code: 1, msg: '请先登陆'})
    }

  })
})


module.exports = router;
