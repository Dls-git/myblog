<script setup >

</script>

<template>

<div class="header">
<div class="img box ">
    <img src="@/assets/img/Mikasa.jpg" alt="">
</div>
<div class="nav box arrange">
  <div class="nav-container arrange">
    <div class="nav-item arrange hover-item  ">
      <router-link to="/" class="home link">首页</router-link>
    </div>
     <div class="nav-item hover-item">
       <router-link to="/layout/about" class="about link">关于</router-link>
     </div>
     <div class="nav-item hover-item">
       <router-link to="/layout/time" class="time link">时间</router-link>
     </div>
     <div class="nav-item hover-item">
       <router-link to="/layout/friends" class="friends link">朋友</router-link>
     </div>
     </div>
</div>
  <div class="search box " >
     <button class="search-btn">
       <img src="@/assets/img/search.png" style="height: 24px; width: 24px;" alt="">
     </button>
  </div>
</div>



</template>

<style scoped>
.header {
  /* 头部,固定在顶部 ,高度全部占用(后期可以去layout修改一下)*/
  height: 100%;
  width: 100%;
  /*header里面三个div，一个放头像，一个放导航，一个放搜索*/
  display: flex;
  /*固定在顶部*/
  position: fixed;
  z-index: 2;
  background: rgba(255, 255, 255, 0.8); /* 半透明白色背景 */
  /* 模糊背景 */
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
/*超链接类，取消下划线，设置字体大小和颜色*/
.link{
  text-decoration: none;
  font-size: 20px;
  color: rgb(80, 80, 80);
}
/* 每个div占比相等 */
.box{
  flex: 1;
  height: 100%;
}
/* 导航项悬停效果 */
.hover-item:hover {
  background: rgba(22, 93, 255, 0.1); /* 浅蓝背景 */
  color: rgb(46, 179, 255); /* 文字变蓝 */
}

.img {
  /*组合起来是为了头像和导航项在同一行*/
    display: flex;
    align-items: center;

  img{
    display: block;
    border-radius: 20px;
    height: 65px;
    width: 65px;
    /* 头像和导航项之间的间距,控制得和最外层的容器一致 */
    margin-left: 10vw;
    /*防止头像被拉伸*/
    object-fit: cover;
  }

}
.nav {
  .nav-container {
    height: 50%;
    width: 70%;
    background: white;
    /* 导航项容器,圆角边框,阴影 */
    border-radius: 50px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    .nav-item {
      /* 导航项,等比分配宽度 */
      flex: 1;
      height: 100%;
      display: flex;
      /* 导航项,居中显示 */
      justify-content: center;
      align-items: center;
    }
  }
}

.search{
  /* 搜索框,固定在右侧 */
  display: flex;
  justify-content:flex-end;
  align-items: center;
  .search-btn{
    display: block;
    border-radius: 50%;
    border: none;
    height: 50px;
    width: 50px;
    /*控制和内容在一个区域*/
    margin-right: 10vw;
  }
}

</style>
