---
title: 大一古早时期学习java
date: 2025-03-01
category: 后端开发
tags:
  - java
  - javase
description: 一月学习随手记
updated: 2025-04-02
readingTime: 60
wordCount: 12000
---


# *** java***

***



## cmd操作指令

盘符：进入盘符

cd目录进入    cd目录1\目录2\进入

dir查看当前路径下的内容

cd.. 退出这一级  cd \回到盘符

cls清屏

exit退出

***



byte short 类型计算时会先变成int类型

有字符串参加+的运算时，后面所有的运算变为字符连接。

如果连续+号则从左到右依次完成

&会吧两个都计算完成（右边是会执行的），&&先计算第一个，错误就不计算第二个，

但两个都需要同时正确才可以

||和|也一样、

***

# 三元表达式

* 表达式？表达式1:表达式2

* 正确取1，错误取2 

***



# **数组**



## 写法

* 上有点相反int[] arr=new arr[数组长度]
* int默认全0，double 0.0，字符为'/0000',布尔类型为flase
* java里面的函数只是多了一个public static 
* 其他和c语言是一致的
* 同名的方法里面有不同的参数类型和个数就是重载，这些方法具有同样的功能

## 数据类型



* 基本数据类型：存储的是真实的数据

* 引用数据类型：存储的是地址

***



# 封装

* 将属性用private私密
* 用函数对属性进行赋值 

## 成员变量

* 成员位置是成员变量，函数内部是局部变量

## 就近原则

* 变量之间遵循就近原则，用this关键之可以调用成员变量

* 赋值的时候可以使用this .name=name。

### this

* this的本质是记录方法调用者的地址值

* 在外面要调用类的里面的方法，this会把这个调用的变量的地址记录下来，这个变量地址里面包括了类的属性和方法，
* this.+名字相当于解引用

***





## 构造函数

## 目的

* 是为了在创建对象时方便传递参数

## 相关法则

1. 如果没有定义构造方法，系统会给出默认的无参构造方法
2. 定义了的话，系统将不会给出（如果自己写了构造函数，但是不是无参的函数，而创建时用的是无参函数则会报错）
3. 由虚拟机调动，创建一个对象调用一次
4. 有无参同时存在，都需要同时书写
5. 这函数不能用void 没有具体的返回值不能return

## 快捷键

* alt+insert迅速构造javabeen类

## 标准javabeen

* 先写属性
* 初始化（构造函数，有参和无参 public 类名（）{
* 函数
* 设置set 和 get函数

***







内存地区分为，栈，堆，方法区

在方法区中会加载类文件

栈运行main蛮熟

堆保存new出来的对象

一个流程下来，开头的类文件进入方法区，随着main函数进入栈

如果此时创建一个对象的话

1首先数据类型（类）进入方法区加载出来

2在main函数（栈）中申明局部变量

3在堆里面开辟一个空间（new）

4进行对象初始化赋值的操作

默认初始化，显示初始化，构造函数初始化

5将堆里面的地址通过运算符返回到局部变量之中



成员变量：类中函数外的变量，开辟在堆，

局部变量：函数里面和传递的那个变量，开辟在栈





字符串

赋值方法

（1）直接赋值string s=“abc”，如果对s进行修改，其实是获得了新的地址，原来abc不会被更改（检查串池，赋值地址）

（2）有new的方式

string s=new string()

string s=new string(传入字符数组),s就会变成字符数组拼接的结果，可以用来修改字符串

string s=new string(bytes)

byte []arr={ 99,998......}

在字符串里面会用通过aci||码表变成对应的字符

键盘录入的也是new出来的

函数

(1)equals和equalignorecase比较字符串

（2）可以直接将索引变成对应的字符

（3）字符串可以直接相加



stringbuider字符串容器数据类型

可以空参数构造，也可以传递字符串构造，用完后记得变回string

![{53D569D9-AE1A-4C9A-914C-8F692021D549}](C:\Users\28796\Desktop\{53D569D9-AE1A-4C9A-914C-8F692021D549}.png)

stringjoiner(方便格式化输出，有间隔，开始，中间三个标志服)

add（“间隔字符”，“开始字符”,“结束字符")

length()返回所以字符的长度包括空格

tostring字面意思

拓展：关于容器

（1）如果不赋值初始的字符串，则容量是16

赋值了初始字符串，容量是字符串的长度+16

（2）超出容量

1.扩容会是标准容量的2倍再+2

2.超出扩容则会以实际的长度作为容量



字符串的拼接底层逻辑

（1）无变量参与

string s="a"+"b";

在java文件编译转换成class文件的时候，s在class文件里面会变成s="ab"这与直接赋值没有任何区别

（2）有变量参与

jdk8以前  s="a",s1="b"，s1+=s;

首先在堆内存的字符池里面会开辟空间存放“a","b"

当调用”+“加号的时候，会在堆内存里面先创建stringbuider对象

将字符串“a"+"b"拼接在一起形成”ab",再利用tostring方法创建一个字符类型，复制相同的内容，再把这个字符类型的地址返回给变量s1

（容器和字符对象的地址不会相同，且容器不会被销毁，这会导致，每次使用一个+号就会开辟两个对象，很浪费内存）

jdk8字后

电脑会先评估字符串的长度，然后开辟一个数组存储，再变成字符串

反正也是new对象了











==

基本数据类型比较值

引用数据类型比较的是地址值









集合arraylis

格式：arraylist<引用数据类型> 变量名=new arraylist()

功能：增删改查

boolean add（）

boolean remove("引用数据类型")

返回引用数据类型 remove(索引)

  返回修改的那个数据 set(索引，要改的内容)

返回查询的数据get(索引)

当然用包装类integer characTER可以传入基本数据类型







多层循环退出

（1）可以用标号loop+冒号标记在循环旁边，直接break loop

（2）system.exit（0）直接结束所有程序



static可以修饰成员变量，也可以修饰函数

在加载字节码文件的时候（非静态的成员变量和所有的方法都会被加载到方法区，静态变量会在堆内存中开辟一块区域，专门存发静态变量），静态变量具有先于对象创建的特点。

而非静态方法的调用需要，对象的创建，然后虚拟机给方法传入对象的地址值，以此来访问成员变量。静态方法调用时可能成员变量（类的实例变量）还未创建，无法访问。

因此，静态之间可以互相调用，（类.调用），非静态可以调用全部的变量和方法；

![{07CFC71C-B5A7-43E6-B163-2B7E5C7DE551}](C:\Users\28796\Desktop\{07CFC71C-B5A7-43E6-B163-2B7E5C7DE551}.png)

在内存里面，静态存储的位置会和字节码文件一同加载出来（class文件)，先于对象出现，属于类的公共区域，想要直接去拿。



类的分类（javabeen类（狗猫学生），测试类（含main函数入口）,工具类



数字变成字符串，字节用字符串去做加法

字符串的“5”变成数字，可以先用charart变成char再强制转化   int n= Integer.parseInt()

***

继承

父类的构造方法完全不能继承

父类的成员变量全都可以继承，但是private的变量需要用函数来访问

父类的函数，不被private static final修饰的方法会放入虚方法表，然后一路继承下来



成员变量的访问特点

就近原则，调用变量的时候，先在局部里面寻找，找不到再去子类，子类找不到就去父类找。

如果出现重名的情况，super指代父类，this指代本类

方法重写的时候要加上@override

this()表示调用本类的其它构造，写在无参构造下面

构造方法的访问分父类有无 无参构造，如果有，则不用super调用，没有就要 用super（）点名调用父类的具体构造方法，因为子类可能会需要用到父类的成员变量，父类必须要初始化完成。

***

多态的优势

1：以父类作为参数对象进行传参，可以精准地应对不同对象具有不同特性方法的情况

2：以多态的形式创建对象，调用方法的时候是根据你所创建的类型有关的，维护只需要修改你所创建的那个对象（new那个地方）

弊端

1只能访问父类的成员变量，父类的方法，和子类重写的方法

（1，这是多态，使用多态只能调用重写的方法。编译器会检查父类是否有对应的方法，父类没有则直接报错）

方法：

想要访问子类的特定方法（子类的成员变量）：

1：进行强制转换，将这个变量转为子类（也就是具有特定功能的子类类型）。使用关键字instanceof 

例如if(a instanceof dog（类型）d)意为先判断变量a的类型是不是dog 如果是先进行强制转化再把变量名改为d

2：在子类里面重写一个获得成员变量的方法

***

final关键字：具有最终的绝育的作用

修饰函数：这个函数不允许再被重写（作为一种规则）

修饰类：这个类不再允许被继承

修饰变量：直接变成常量（final double pi=3.14......)   书写规则是全部用大写，下划线分开单词

(1)基本数据类型则数值不变

（2）如果是引用数据类型，不变的是地址值。对象内部的属性仍然可以修改

***



权限修饰符

privated<空着<protected<public

1：本类  2：本包  3：其它包的子类 4：全部可用

（类可以被导入到其它包里面去调用的。这是对3的解释。把这个类弄到别的包去做父类）

***



static静态代码块作用

作用时机：跟着类的加载一起加载

作用次数：一次 

作用：初始化静态成员变量/

写法：在类里面static{

/*初始化*/

***

# **抽象类**

## 意义

* 父类的方法无法满足子类使用，用来强制子类重写方法的一种手段，防止乱起名不规范

## 格式

* 类的书写格式     `  public abstract class类名{}   `

* 方法的书写方式  ` public abstract  void 方法名（）`；不用写方法体

## 关于类的内部

1. 可以有成员变量（用来给子类赋值）
2. 可以有构造方法
3. 可以有抽象方法也可以没有，但如果有抽象方法必须是抽象类。也可以有普通方可法
4. 以new的形式创建

## 继承

* 子类要么全部重写，要么子类是抽象类

***

# **接口**

## 意义：

* 我理解为相当于把方法抽象成一个抽象类，允许各种各样的类来继承，但是又不用添加到父类里面去。

* 从而实现方法可以被不同的类来调用

  

## 书写格式：

```java
{

public abstact void 方法（）；

抽象方法的书写

}
```



## 类和接口的关系

1. 类与类之间只能实现单继承
   2. 类与接口之间是可以多“实现”
      1. 需要重写方法里面所有的方法（方法签名一致的话只用写一个）
      2. 方法签名：方法名和传入参数决定方法的唯一性，如果只是修改是否有返回值，编译器无法识别唯一性.
      3. 重名的方法只能通过重载的方式，全部重写到子类（如果你方法签名一致则 不需要）
      4. 抽象方法除了没有方法体，其它全部一样



### 接口和接口可以多继承

* 如果实现最后一个子接口，需要重写所有的方法（父）



## 接口内部

* 成员变量默认是常量，用 public static final修饰（直接用接口名字访问)

* 没有构造方法

## 接口升级

### 意义：

* 接口需要添加更多的功能但不希望报错出现

### 默认方法：

* 在接口内部用default书写的方法，它会被**继承**到实现类之中，**并且不要求重写**。
* **子类直接调用的话则是实现类的方法**。**子类重写后就是执行自己的方法。**
* 如果实现类多个接口中出现了重复名字的默认方法，则必须要重写。

### 静态方法：

* 在接口内部用static书写的方法。只可以用接口的名字去调用
* （有点类似把接口当做了一个工具类，直接使用接口里面的功能，scanf）

### 私有方法：

* 在接口内部用private书写的方法，解决接口内部代码重复的一个手段，并且不希望外部去访问。
* 只用private修饰表示只可以在默认方法内调用，用【private static修饰表示只能给静态方法使用

## 适配器设计模式

### 意义：

* **一个接口方法太多，但是我只想调用一个**

### 操作：

1. 用一个**中间类**（适配器）去实现接口，**空实现重写**所有的方法（此时这个类里面的方法已经不是抽象方法了）

2. 再用**子类去继承父类**的方法，把**父类抽象**掉**（不让他实例化，没有意义）**

3. 就可以在子类之中**调用父类**的方法了

***

# **内部类**

##    成员内部类

1. 定义位置：成员变量地方，方法之外

### 别人访问内部类特点：

1. 外部类之内：外部类里的方法如果想要用内部类的数据，需要先创建

2. 外部类之外：	

   ​	1.外部类写一个专门的方法，返回内部类的值，用于对外提供内部类对象（private修饰，用父类接受这个

   ​	2.链式创建，Outer.inner  a=new outer.new inner();象）

​					

### 变量重名时：

1. 在创建内部类的时候，会创建外部类对象和内部类对象，这两个具有不同的地址值。在内部类的地址值里面用  外部类名.this.记录着外部类的地址值。其中this记录的是内部类的地址值。

## 匿名内部类

### 意义

1. 一次性类，简化了类的创建过程。
2. 当参数是父类或接口时，可以创建匿名内部类直接传入参数

### 定义格式

```java
```

```java
new  类/接口 ()
/{
重写的方法
}
```

### 格式内涵

```
```

```java
new 子类 子类名字 extends/implement 父类/接口()
{
      重写方法
}相当于将头上的部分，删去了子类的类型，名字，直接写出实现的接口或者继承的父类。然后进行方法重写和创建对象
```

### 隐藏的关系

1. 花括号里面的才是类的主题，new出来的只是对象而已
2. 这存在包含或继承关系
3. 创建了一个新的对象
4. 如果要接受对象比如 ` 接口 a= new 接口（）{重写方法}`   ` animal a= new animal(){}`是实现了一种多态

### 应用场景

```java
public static void method(father)
{
father.work;
}


method(
new father(){
@override
方法
}

)
作为参数直接传入
```

***

```java
whrows ioexception
runtime.getruntime().exec()
shutdown -s -t:
shutdown -a
定时关机
```

***

# **object**

**在 Java 里，所有类都直接或间接继承自 `Object` 类，如果方法调用了对象里面来自boject的方法，而又不重写，那就回用object的：**

### 常用方法

 1. **tostring：（经常要重写）**

    `toString` 方法返回对象的字符串表示形式。`Object` 类中的 `toString` 方法返回的是对象的类名和哈希码的十六进制表示，通常不能满足实际需求，因此需要重写该方法以提供更有意义的信息。
        
    * 代码演示

    * 

    * ```java
      class Person {
          private String name;
          private int age;
       @Override
          public String toString() {
              return "Person{name='" + name + "', age=" + age + "}";
          }//不再打印哈希值，打印具体需要的信息
      }
      ```

 2. clone，浅克隆和深克隆

     对于基本数据类型，两者都是直接复制，对于string类型则是复用串池，对于引用数据类型，浅克隆是直接复制原来的地址值，深克隆是新建一个地址值，再把内容复制（重写方法、 

     

      **.equals方法（经常重写）**
     
      原则
     
      1. 自反性，就是自己检查自己一样的对称性，`y.euals(x)==x.equals(y)`
     
      2. 传递性，就是几个变量之间x，y，z互相检查应该都是中正确的
     
      4. 非空性：传进来的如果是null，必须返回false，**先做非空判断**
         
      2. 方法重写
         class Person {
             private String name;
             private int age;
             //两个变量去比较里面的name和age是否一致
             
         ```java
         @Override//重写equals方法
         public boolean equals(Object o) {//这里的对象写的是超级父类，以便应对各种传入类型
             if (this == o) return true;//先做自己的判断
             if (o == null || getClass() != o.getClass()) return false;//非空判断和类名判断
             Person person = (Person) o;//强制转换再提取数值比较
             return age == person.age && Objects.equals(name, person.name);
         }
         
         @Override
         public int hashCode() {
             return Objects.hash(name, age)
         }
         ```

***

 # string 

~~~java
 ```java
  ## 常用方法
  
  1. length
  2. **`indexOf(String str)`**：返回指定子字符串在此字符串中第一次出现处的索引。
  3. **`lastIndexOf(String str)`**：返回指定子字符串在此字符串中最右边出现处的索引。
  4. **`toLowerCase()`**：将此字符串中的所有字符都转换为小写。
  5. **`toUpperCase()`**：将此字符串中的所有字符都转换为大写。
  6. `startsWith` 方法的作用是判断字符串是否以指定的前缀开头。
     1. 检查过程按字符逐个比较，从字符串的第一个字符开始，一直到 `prefix` 字符串的最后一个字符。如果所有字符都匹配，方法返回 `true`；否则返回 `false`。
  7. `split` 方法
     1. 将字符串拆分成字符串数组
  8. charAt(int index)，用索引反弹字符
  
  ***
 ```
 
 ***
~~~

***

 # 装箱

integer.valueof(int)->int

```java
Integer.parseInt()->字符串转化为int类型
```




***

### objects工具类

1. equals（对象a，对象b）
   1. 先判断对象a是不是空指针
   2. 接着如果不是就判断a与b的地址值想不想等
2. isnull 判断该对象是不是空指针

​	

***

//分块查找，先分块，每块最大值小于后者最小值，类记录max，和索引范围
//确定在那一个块之中
//在块内遍历即可

拓展：给区间带上最小最大值     哈希查找

```java
//插入排序
//找到第一个无序 的索引，再把无序的数据依次从后往前插入，通过大小关系不断地交换位置
int startindex=-1;
for (int i = 0; i <arr.length-1 ; i++) {
    if (arr[i] > arr[i + 1]) {
        startindex = i + 1;
        break;
    }
}

for (int i = startindex; i <arr.length-1 ; i++) {
    int j=i;
    while(j>0&&arr[j-1]>arr[j])
    {
        int t=arr[j];
        arr[j]=arr[j-1];
        arr[j-1]=t;
        j--;
    }
}
```

```java
public  static  void quicksort(int[]arr,int i,int j)
{
    if(i>=j)
    {
        return;
    }
    //以0索引的数字作为基准数，i和j就是需要排序的范围
    //双指针，start end，end从右向左寻找比基准数字小的索引，往左移动
    //start寻找比基准数大的数字，想右移动
    //start和end进行交换
    //两者相遇，左边比基准数字小，右边比基准数字大
    int start=i,end=j,basenumber=arr[i];
    while(start!=end)
    {
        while(true)
        {
            if(start>=end||arr[end]<basenumber)
                break;
            end--;
        }
        while(true)
        {
            if(start>=end||arr[start]>basenumber)
                break;
            start++;
        }
        int t=arr[start];
        arr[ start]=arr[end];
        arr[end]=t;

    }
    int t=arr[i];
    arr[i]=arr[end];
    arr[end]=t;
    quicksort(arr,i,end-1);
    quicksort(arr,end+1,j);
```

***

# Arrays常用方法

* **tostring**
  * 使用原因：直接打印数组的话会变成地址


**如果是引用数据类型的话，它会调用每一个元素的tostring方法，此时我需要重写tostring'防止变成地址值**

```java
String str= Arrays.toString(arr);
System.out.println(str);//[6, 5, 2, 7, 3, 9]
```

* binarysearch
* 二分查找算法，如果不存在，会返回（-应该插入的索引-1)

copyof(要拷贝的数组，新数组的长度)

按顺序拷贝，太小就拷贝一部分，太长就补充0

* coyyofrange（数组，起始索引，结束索引）
* 包左不包右，右边那个是不拷贝的

sort（数组）

利用快速排序实现升序

* sort（引用数组，new comparator匿名类）
* 1. 要改写成包装类
  2. 要写匿名内部类

原理：

1. 利用的是插入排序和二分查找

   1. 插入排序是指，以0索引的数字为有序，其它无序
   2. 二分查找是在内部类实现的

   

2. ```java
   Arrays.sort(drr, new Comparator<Integer>() {
       @Override
       public int compare(Integer o1, Integer o2) {
           return o2-o1;
       }
   });
   
   ```

在sort方法内部，会调用匿名内部类的方法，匿名内部类会返回数值

1. 数字是负数，就说明这个数字跟前面的比小了，往前排序
2. 正的就是大了，往后排
3. o2就是要比较的数字，o1就是要排列的数字，确定o2的方法是用的二分

**o1-o2升序，o2-o1降序**

```java
public class day8 {
    public static void main(String[] args) {
        gf a=new gf(18,"xiaoming",170);
        gf b=new gf(18,"xiaoming",175);
        gf c=new gf(19,"aiaoming",170);
        gf d=new gf(19,"biaoming",170);
        gf [] arr={a,b,c,d};
        //sort 排序，先拍年龄，再拍身高，再拍姓名
                Arrays.sort(arr, new Comparator<gf>() {
                    @Override
                    public int compare(gf a, gf b) {
                        if(a.getYear()==b.getYear())
                        {
                            if(a.getHeigh()==b.getHeigh())
                            {
                                return a.getName().compareTo(b.getName());
                            }
                            else
                            { return a.getHeigh()-b.getHeigh();}
                        }
                        else return a.getYear()-b.getYear();

                    }
                });
               
                
                
```

可以利用if条件，进行多条件排序

重写的方法就是用来提供返回值，然后在里面通过返回值进行排序，所以我只需要书写返回值的方法就可以了

***





# lanmbda表达式

## 思想

* 函数式编程思想[^1]

[^1]: 只关注用什么方法实现不关注是哪一个对象完成

## 使用场景

* 用来简化匿名内部类的写法
* 这个只能简化接口的
* 接口只能有一个抽象方法（其实就是唯一性，我没有了函数的名字，无法确定调用接口里面的那个函数）

## 写法

```java
//调用方法
    method(new swim() {
        @Override
        public void work() {
            System.out.println("hahahha");
        }
    });
    }
___________________________________________________________________________________________________
//写一个方法
public static void method(swim s) {
    s.work();
}
//写一个接口
interface swim {
    public void work();
  }//这是 原始的匿名内部类的写法
```



```java
method(
() ->
        System.out.println("hahhaha")
);//这是改成lambda表达式的写法
//我们删去了创建的对象，函数的名字，留下了方法体（方法体里面没有分号，因为只有一行，需要删去分号和return）
```

***

# println函数理解

* System.out.println()方法在接收一个对象作为参数时，**实际上会调用该对象的 `toString()` 方法将其转换为字符串**，然后再将这个字符串输出到控制台

* 在 Java 里，**所有类都直接或间接继承自 `Object` 类**，而 `Object` 类有一个默认的 `toString()` 方法，其实现如下：

  ```public String toString() {    return getClass().getName() + "@" + Integer.toHexString(hashCode()); }```

* 如果一个类没有重写 `toString()` 方法，那么调用 `System.out.println()` 打印该类的对象时，输出的就是类名加上 `@` 符号和对象的哈希码的十六进制表示。

***

#  单列集合

### 定义：

* 单列集合存储的是单个元素，集合中的每个元素都是独立的个体，它们之间没有直接的关联。

## collection

###                  定义的**通用方法**

1. **add增`boolean add(E e)`**

   - **功能**：将指定的元素添加到集合中。如果集合因为调用该方法而发生改变，则返回 `true`；如果集合不允许重复元素且已经包含该元素，则返回 `false`。

   1. * list永远返回true，因为可以重复
   2. * set，存在就法flase，不存在就是true

1. **collections.addall大批量添加**

2. clear全删

3. remove删boolean remove(Object o)`中间放删去的东西

   1. **功能**：从集合中移除指定元素的单个实例（如果存在）。如果集合因为调用该方法而发生改变，则返回 `true`。

4. **contains查 ` boolean contains(Object o)`**,**统计思想**

   1. 底层是依靠object类的**equals**方法实现的，所以集合如果存储的是自己定义的对象，一定要重写**equals**方法

5. size  ` int size()`

6. isempty（**用于循环判断**）

7. #### `iterator生成迭代器用于遍历`

8. 可以有**有参构造输入数字和数组**，**表示指定长度或者是复制某个元素；**

9. copyof（目标集合，源集合），要求目标集合长度大于等于源集合

### **遍历方式**

1. 迭代器：**视为一种滑动的指针**

   1. * `Collection` 接口继承了 `Iterable` 接口，因此所有实现 `Collection` 接口的集合类都可以使用迭代器进行遍历。

      * 迭代器提供了 `hasNext()` 方法用于判断是否还有下一个元素

      * `next()` 方法用于获取下一个元素

      * `remove()` 方法用于移除当前元素。

      * **不可以在里面用集合的方式进行增删改**

      * next（）方法用一次就好了

      * ```java
        Collection<String> coll = new ArrayList<>();//先创建集合
        collection.add("apple");
        collection.add("banana");
        collection.add("cherry");//添加元素
        
        Iterator<String> it = coll.iterator();在coll里面调用生成迭代器的方法
        while (itr.hasNext())//判断下一个是否还有元素
        {
            String element = it.next();获取元素，并移动指针
            if("aaa".equals(element))
            {
            it.remove()//删去最后一个返回的元素
            }
            else 
            System.out.println(element);
         }
        ```

2. ### 使用增强 for 循环（for - each）

   1. * 增强 for 循环底层也是使用迭代器实现的

      * 格式//**简写，集合名字.for**

        * ```java
          for(数据类型 临时变量名：单列集合 集合名字)
                  {
                      sout s；
                  }
          ```

```java
Collection<String> collection = new ArrayList<>();
collection.add("apple");
collection.add("banana");
collection.add("cherry");

for (String element : collection)
{
System.out.println(element);
 }
```

3. **调用for each方法遍历**

   1. * 底层原理：forecah方法需要传入一个接口的实现类，我们需要重写这个接口的抽象方法

      * 在foreach方法底层是遍历获得每一个元素，再调用实现类里面的方法，传入这个元素

      * 那么我们只需要把实现类里面的方法改成sout即可

      * 

      * ```java
        coll.forEach(new Consumer<String>() 
        {
            @Override
            public void accept(String s) {
                System.out.println(s);
         }
        });
        ```



```java
for(String s:coll)
{
    System.out.println(s);
}//lambda简写
```

***

### list

#### 数据特点

有序，可重复，有索引

#### list的增删改查

1. add（索引，对象）指定位置插入             **包装类手动封箱[^2]**
2. remove（索引），返回删去的对象
3. set（索引，要修改的对象）返回被修改的对象
4. get（索引）获取要查询的索引
   1. indexof（对象）弹出第一次出现这个元素的索引
   2. lastindexof（对象）弹出最后一次出现这个元素的索引

#### 新的遍历方式

用listiterator来编列，可以增加**新的元素**

[^2]:`Integer i=Integer.valueof(number)`调用数据的静态方法，valueof来封箱

#### arrayslsit的底层分析

* 本质是数组，**空参构造是创建长度为0的数组**，**默认容量也是0**。
* 用add（对象）时，会调用add的重载方法add（对象，底层数组，现在的arraylsit的长度）
* 添加第一个元素时候
  * list的size和默认容量相等，进行扩容。调用grow方法，传入size+1表示添加完元素的最小容量
  * 进入扩容，先创建`old capacitiy`标记老容量
  * 进行判断，判断老容量是不是零，或者这底层数组是不是空数组（就是判断你是不是第一次添加）
  * 是的，则返回一个新数数组，数组长度是max（size+1，默认扩容（10））
* 添加多个元素
  * 没有满就直接用数组方式加入
  * 如果list的长度和数组的容量相等时，则会调用grow（sizae+1）扩容方法，size+1就是添加完元素的最小容量
  * 在grow的方法里面，会记录老的容量
  * 先进行判断数组是否>0或者当前的底层数组长度还是不是默认的容量1
  * 不是，开始扩容，调用newlength方法，传入三个参数
  * 老容量，理论上最小的需要扩容的容量，默认扩容（1.5倍）
    * 在newlength方法之中会记录真实需要的容量——老的+max（理论上的，默认扩容的
  * 然后返回真实需要的长度，利用array .copyof复制一个新的底层数组返回

#### iterator源码

1. 遍历方式代码

2. ```java
   ListIterator<String>iterator=list.listIterator();//获取迭代器
     while(iterator.hasNext())//检查当前元素是存在
   {
       String str=iterator.next();//移动指针到下一位，弹出当前元素
      sout（s)
   
   }
   ```

* 在调用`list.listIterator();`这个方法的时候，其实就是创建了一个new itr对象

* itr对象是个实现了iterator的内部类

* 内部类里面包含cursor指针（指向下一个元素），lastindex指针（指向当前元素），expectmod，以及hasnext方法和next方法

* hasnext

* ```java
  public boolean hasNext() {
      return cursor != size();
  }
  ```

* next

* ```java
  public E next() {
      checkForComodification();
      try {
          int i = cursor;
          E next = get(i);
          lastRet = i;
          cursor = i + 1;
          return next;
      }
  ```

* 每次调用都会检查修改次数是否一致，防止并发修改问题，导致数据遍历有误
* 用临时变量i记录当前遍历数据，移动cursor，返回索引i的对象

### set

#### hashset

#### 数据结构

1. jdk8之前，数组，链表
2. jdk8之后，数组，链表，红黑树

#### 特点

无序（存取顺序不同），无索引，去重

#### 底层

* 哈希值，调用hasdcode函数，利用对象的属性值去计算一个int类型的整数
  * 默认是地址值，**如果是自定义对象的话，需要重写equals和hasdcode函数**
* 利用 数组的长度和哈希值计算这个元素的索引
* 最开始会有一个默认长度为12的数组，加载因子为0.75
  * 当存储的元素数量达到12*0.75时自动扩容
* 找到存储的位置
  * 如果是null，存入
  * 不是null，去把这个位置上的所有元素利用equals方法对比，
  * 对比如果都不同的话，那么直接挂在最后一个元素上，链表尾插法
* 当链表元素大于八个，且数组的长度大于64时，转化为红黑树

#### linkedhaset

#### 数据特点 

提取顺序固定，去重，无索引

不过是在原有的基础上，给每个元素上了双链表，使得提取的顺序一致了

### treeset

#### 数据特点

有序，去重，无索引

#### 底层

* 红黑树。

  * 在利用add函数添加时，会调用这个对象的**comparaTo**函数，再把它插入到红黑树之中

  * 如果想修改排序的方式，那么我们需要自定义
#### 两种定义比较方法

* 第一种：让这个类实现comparable这个接口，重写comparaTo方法

    ```java
    @Override
        public int compareTo(student o)
        {
            return this.getYear()-o.getYear();
        }//o是红黑树之中已经存在的元素
    ```

* 第二种利用treeset的有参构造，传递一个匿名内部类去实现comparator

* ```java
  TreeSet<student>ts=new TreeSet<>(new Comparator<student>() 
  {
              @Override
              public int compare(student o1, student o2) {
                  return 0;
              }
      })//o1是添加的对象，o2是已经存在的对象。中间写比较规则
  ```

## 单列集合的选择

1. 可重复
   1. list
      1. 默认arraylist
      2. 删除修改操作频繁：linkedlist
2. 去重
   1. set
      1. 默认hashset
         1. 要求有序treeset
         2. 先进先出linkedhashset

***

# 双列集合

## 数据特点

* 有两个数据，一个键，一个值，组成键值对entry
* 键是唯一的，值不唯一

## 常用方法

1. put（键，值）
   1. 键相同覆盖上一个值，并且返回
2. remove（键）用键删去值
3. clear全部删去
4. size长度
5. map.keyset()转化键值为集合
6. map.entrtset()转化为键值对集合
7. map.get(键)用键找值

### 有参构造

* 在有参构造里面传入另外一个map，相当于复制了一份

## 遍历方式

1. 利用**键能找值**的方法遍历，将键做成一个集合，利用集合的遍历方法获取出每一个键，再用map函数映射出值

   1. ```java
      	Map<String,String>map=new HashMap<>();//创建对象
      	Set<String>keys=map.keySet();//转化为键集合
      	for (String key : keys) 
      	{
                  System.out.println(key+"="+map.get(key));//map.get(key）就是关键方法
           }
      ```


2. 利用**键值对里面的get方法**，所以需要先把map转化为键值对

   1. ```java
      Set<Map.Entry<String,String>>entries=map.entrySet();//<Map.Entry<String,String>>这是entry数据类型，泛型嵌套
      for(Map.Entry<String,String>entry:entries)//增强for遍历
              {
                  System.out.println(entry.getKey()+"="+entry.getKey()+"哈哈");
                  //entry.getKey   entry.getKey这是entry的方法
              }
      ```

3. 利用它本身的**foreach方法（lambda）**

   1. ```java
      map.forEach(new BiConsumer<String, String>()
      {  @Override
         public void accept(String key, String value)
         {
            System.out.println(key+"->"+value);
          }
       }
           );
      ```

## hashmap

### 底层

* 依赖哈希表形成
* 利用equals和 哈希值检查键同不同

## treemap

### 底层

* 依赖红黑树实现，可以选择自定义的排序数据的方式,，于treeset类似

### 统计思想

* 把要统计的对象当做键，次数当做值
* 使用treemap or hashmap
* 然后想办法便利需要统计的数据
* 获得每一个数据，在for循环里面拿这个数据去调用map的contains方法，判断是否存在
  * 存在则利用map里面的get方法获取key值，加加后再put回去
  * 不然则用put添加

## 集合嵌套

`treemap<string ,arraylist<strimg>>treemap=new treemap`

## 不可变集合

1. collection

   1. 运用list.of
   2. 运用set.of
      1. 方法传递的是可变参数，也就是说你可以单独传每一个数据，也可以直接传入一个数组

2. map

   1. 法1：直接调用copyof方法（map集合），直接返回一个不可变map

   2. 法2：

      1. 原因：由于只能传入一个可变参数，但是键值对是两个，所以直接传入键和值是有数量上限的

      2. 我们将键和值打包成键值对（set），再把set转化为数组（可变参数）传入of函数之中

      3. map->set(装entry)->数组（装entry）->调用map . ofentry->返回map

      4. ```java
         HashMap<String,String>hashMap=new HashMap<>();
         hashMap.put("1","one");
         hashMap.put("two","two");//创建一个hashmap
         
         Map.Entry<String,String> []preparearr=new Map.Entry[hashMap.size()]; 
         hashMap.entrySet()//转化为一个装着键值对（entry）的set集合
         hashMap.entrySet().toArray(preparearr)//将set集合转化为数组，为of方法传入数组做准备。
                                     // 其中这个toarrays的括号要传入一个储存着同类型数据的数组
         preparearr=hashMap.entrySet().toArray(preparearr)//接受数组
         Map.ofEntries(preparearr)//调用方法传入数组，返回map集合
         ```

***

# 可变参数

## 本质

* 是一个数组

##  格式

* 数据类型+... +数组名·` int ... arr`

  

## 注意

* 只能有一个可变参数
* 可变参数写在最后，形参写在前面

***

# collections工具类

## 方法

1. **addall(单列集合，批量数据)**

2. shuffle(单列集合)，打乱集合内部的元素

3. max/min（集合）默认的自然排序获取最大的元素

4. swap（集合，int i，int j）按照索引交换

   其它和arrays一致

***

# 对容器的合并

## 数组

1. 调用system.arraycopy方法

   1. ```java
      int[] arr1 = {1, 2, 3};
              int[] arr2 = {4, 5, 6};
              int[] mergedArray = new int[arr1.length + arr2.length];
      
              System.arraycopy(arr1, 0, mergedArray, 0, arr1.length);//从arr1的0索引开始复制，复制到mergedArray，起始复制位置是0，复制的长度是arr1.length
              System.arraycopy(arr2, 0, mergedArray, arr1.length, arr2.length);
      ```

   2. stream流

      ```java
      int[] arr1 = {1, 2, 3};
              int[] arr2 = {4, 5, 6};
      
              int[] mergedArray = IntStream.concat(Arrays.stream(arr1), Arrays.stream(arr2)).toArray();
              System.out.println(Arrays.toString(mergedArray));
      ```

## 单列集合

1. #### 使用 `addAll` 方法

   1. ```java
      List<Integer> list1 = new ArrayList<>();
           	collections.addall(list1,1,2,3,4);
              List<Integer> list2 = new ArrayList<>();
              collections.addall(list2,5,6,7,8);
         		list1.addAll(list2);
              System.out.println(list1);
      ```

      1. `addAll` 方法会将指定集合中的所有元素按顺序添加到当前 `List` 的末尾。

2. stream流合并

   1. ```java
      List<Integer> mergedList = Stream.concat(list1.stream(), list2.stream())
                      .collect(Collectors.toList());
      ```

## 双列集合

1. 使用 `putAll` 方法

* `Map` 作为双列集合，有 `putAll` 方法，可将一个 `Map` 的键值对添加到另一个 `Map` 中。若键重复，后面 `Map` 的值会覆盖前面 `Map` 的值。

```java
 Map<String, Integer> map1 = new HashMap<>();
        map1.put("a", 1);
        map1.put("b", 2);

        Map<String, Integer> map2 = new HashMap<>();
        map2.put("b", 3);
        map2.put("c", 4);

        map1.putAll(map2);
```



2. stream

   1. ```java
      Map<String, Integer> mergedMap = Stream.concat(map1.entrySet().stream(), map2.entrySet().stream())
                      .collect(Collectors.toMap(
                              Map.Entry::getKey,
                              Map.Entry::getValue,
                              (existing, replacement) -> replacement,
                              HashMap::new
                      ));
      ```

      1. `Map.Entry::getKey`这是类的对成员对象方法的调用，表示流里面的数据对象entry引用了getkey方法返回了key值
      2.  `(existing, replacement) -> replacement,`当流中存在重复的键时，该函数会处理冲突。`existing` 代表已经存在于结果 `Map` 中的值，`replacement` 代表新的值。这里使用 `(existing, replacement) -> replacement` 意味着当出现键冲突时，使用新的值覆盖旧的值。
      3. **`HashMap::new`**：这是一个构造函数引用，作为 `toMap` 方法的第四个参数，用于指定最终结果 `Map` 的具体实现类型。`HashMap::new` 表示使用 `HashMap` 作为结果 `Map` 的实现。

3. 遍历思想

   1. ```java
        HashMap<String,Integer>hashMap=new HashMap<>();
              hashMap.put("1",1);
              hashMap.put("2",2);
              HashMap<String,Integer>hashMap1=new HashMap<>();
              hashMap1.put("1",1);
              hashMap1.put("3",3);
              hashMap1.put("4",4);
               Set <Map.Entry<String,Integer>>entries=hashMap1.entrySet();//遍历其中一个map
         
              for (Map.Entry<String, Integer> entry : entries) {
                  String str=entry.getKey();
                  int temp=entry.getValue();
                  if(hashMap.containsKey(str))//利用统计思想
                  {
                      int count =hashMap.get(str);//元素不单一，自己看看怎么修改这个值（value）
                      int ct=hashMap1.get(str);
                    hashMap.put(str,count+ct);
         
                  }
                  else//如果元素是单一的，那就添加
                  {   int count =hashMap1.get(str);
                      hashMap.put(str,count);
                  }
              }
              System.out.println(hashMap);
      ```

      



# 泛型

## 定义

* 泛型允许在定义类、接口或方法时使用类型参数，使代码能处理不同类型的数据，增强代码的通用性和复用性。`<E>`
* 1. 没有泛型的时候，我们给集合添加数据，会被默认为object类，***导致我们无法用它自己特有的方法***
  2. **可以传递指定数据的子类**

## 伪泛型

* 在编译时要求必须按照特定的类型添加数据，但是加载成字节码文件时全部按object类处理（泛型擦除）
* 运行的时候又会强转成指定的类型，**所以泛型只能用于引用类型**（有继承关系或者实现才可以强转）

## 使用场景

* 当变量类型不明确的时候可以使用泛型，<E>是记录变量类型，而不是记录数据的

## 使用对象

1. 类名<E> 那么将会整个类里面通用<E>

2. <E>返回值，方法名（E e ）只对这个方法起作用

3. 接口写了泛型

   1. 实现类写出具体的数据类型

      1. ```
         public  interface a<E>{
         
         }
         public class b implements a<String>{
         
         }
         ```

  2. 实现类继续续写泛型，在创建对象的时候再明确类型

     ```
     public  interface a<E>{
     
     }
     public classb <E> implements a<E>{
     }
     	b<string>  temp=new b<>()
     
     ```

## 泛型通配符

* 泛型不具备继承性质
  * 如果泛型被实例化了之后，比如只能传递list<animal>类型的数据，其子类lsit<dog>不能传递
* 引入通配符
  * ？ extends E表示可以传递E和e的所有子类
  * ？ extends E 就是父级别的9

***

# stream流

## 设计理念

* 用来表示元素的序列以及对这些元素进行**一系列**的计算操作，它是一种**惰性求值**的机制
  * 惰性求值：一种计算策略，它并不会立即执行计算，而是在真正需要结果的时候才进行计算

## 底层实现

* Stream 流的内部实现是基于**迭代器**的。在执行终端操作时，会遍历 Stream 流中的元素
* 而迭代器只能遍历一次。一旦迭代器完成了遍历，**它就不能再从头开始重新遍历**，所以 Stream 流也就不能再次使用。

## 使用步骤

* 1. 获取一条stream流

     1. 单列集合:直接调用collection里面的stream方法

        ```java
        ArrayList<String>arrayList=new ArrayList<>();
        Collections.addAll(arrayList,"1","2","3","4");
        arrayList.stream().forEach(s-> System.out.println(s));
        ```

     2. 双列集合：用keyset/entryset 转化为集合，再以上面的方法调用		

        ```java
           HashMap<String,String>hashMap=new HashMap<>();
           hashMap.put("1","one");
           hashMap.put("2","two");
           hashMap.put("3","three");
           hashMap.keySet().stream().forEach(s-> System.out.println(s+"->"+hashMap.get(s)));
        ```

     3. 数组：调用Arrays的静态方法stream

        ```JAVA
        String[]str={"aaa","bbb","ccc0"};
        Arrays.stream(str).forEach(s-> System.out.println(s));
        ```

        4. 同样的零散数据：直接用stream.of方法		

           ```java
           Stream.of("111","222").forEach(s -> System.out.println(s));
            		String str="111";
           ```

           

* 2. 选择方法

     * 修改流的数据不会影响原来集合的数据

     * 1. fliter（过滤方法，函数传入了一个接口，用匿名内部类的方式重写方法）

          ```java
          ArrayList<String>arrayList=new ArrayList<>();//创建集合
          Collections.addAll(arrayList,"1-one","2-two","3-three","4-four");//批量添加
          arrayList.stream().filter(new Predicate<String>() {
              @Override
              public boolean test(String s) {
                  //s是遍历得到的每一个数据
                  //true->留下,false->删去
                  return s.startsWith("1");
              }
          });
          ```

  * 2. limit，skip（传入数字）
       1. 表示获取或者跳过前面的n个元素

  * 3. distinct（去重，依赖hashcode和equals方法）

  * 3. count 返回long值

  * 4. contact（流1，流2）

  * 5. collect（打包成集合）**记得调用工具类collectors**

       ```java
       hashMap.keySet().stream().collect(Collectors.toMap(//需要调用collectors这个stream方法类
               //tomap里面具有两个参数，分别是键和值的生成规则
       
               new Function<String, Object>()//function里面有两个类型，类型1是流的数据类型，2是集合中键的数据类型
               {
       
                   @Override
                   public Object apply(String s)//返回值类型需要修改成键的
                   {
                       return null;//这是书写键的生成内容
                   }
               }
                ,
               new Function<String, Object>()
               {
                   @Override
                   public Object apply(String s1)
                   {
                       return null;
                   }
               }));
       ```

  * 6. toarray,打包数据变成数组->**简洁写法**——>`toArray(数据类型[]::new) `**方法引用格式**

       1. ```java
          arrayList.stream().toArray(new IntFunction<? extends Object[]>() 
            //function里面的泛型表示你需要生成的具体类型的数组                         
           {
              @Override
              public Object[] apply(int value) 
                  //value表示数组的长度，这个object需要改成你需要的类型
              {
                  return new Object[0];//0也需要换成value
              }
          })
          ```

  * 7. `allMatch` （内部类）true/false

       1. 方法用于检查流中的所有元素是否都满足给定的条件。
    
    8. `anyMatch` 
    
       1. 方法用于检查流中是否至少有一个元素满足给定的条件。如果有至少一个元素满足条件，则返回 `true`；否则返回 `false`。
    
    9. map，转换流中的数据，依然需要匿名内部类**具有将数据封装为指定对象的作用**
    
       1. ```java
          arrayList.stream().map(new Function<String, Object>() 
           {
              //function函数里面的参数，第一个->原来的类型，第二个->转换成的类型
              @Override
              public Object apply(String s)//方法返回值的类型是要转换的类型
              {
                 //方法体
              }
          })
          ```

​		

***

# 方法引用

## 意义：

* 方法引用是一种更简洁的 Lambda 表达式的语法糖，它能让你直接引用已有的方法或构造函数
  * 语法糖：是编程语言中那些能让代码更简洁、更易读、更方便编写的语法特性。

## 引用规则

1. 引用处必须是函数式接口（相当于再把lambda表达式简化）
2. 引用的方法在参数上的类型，个数上需要一致，返回值需要一致，做的事情需要一致
   1. 思考那个方法能传递一样的参数，做同样的事，返回一样的要求
3. **引用符号`类名::方法`**

## 本质

* 匿名内部类实现接口，传入了一个临时对象进入方法之中。这个临时对象在方法里面会调用我们重写的方法。
* 但如果我们引用了某个方法进去，那么临时对象在调用抽象方法的时候就会被替代成我们引用的方法

##  引用的分类

1. 引用**静态方法**（类名：：方法）（**直接类名调用**）

   1. `Integet：：presentint`

2. 引用**成员方法**(需要**实例的对象**才能调用)

   1. 其它类的成员方法
      1. **new 对象**：：方法
      2. 如果方法写在本类下，在main函数这个静态方法里面不能用**this**
   2. 方法在 本类用this ，在父类用super

3. 引用**构造方法**

   1. 场景：将大批量数据转化成指定对象，转化时完成创建对象(**构造方法需要写一个专门和流上面有一样参数的**)

   2. ```java
       ArrayList<String> arrayList=new ArrayList<>();
              Collections.addAll(arrayList,"zhangsan,15","zhaosi,19","wnagwu,10");
              //我把它转化为学生对象，再进行添加
              //参数是字符串
              //切割为整数，字符串
              //返回对象
              arrayList.stream().map(student::new).forEach(s-> System.out.println(s));
   
      
   
   
        public student(String str) {
              this.age=Integer.parseInt(str.split(",")[1]);
              this.name=str.split(",")[0];
         }
      ```

4. 将1和2合并，通过**类名调用成员方法**（**不用对象就能调用**）

   1. 函数式接口的重写的那个方法，我们 称之为被引用的方法，这个方法里面存在若干个参数

      1. 第一个参数表示，可以调用和它相同类型的类。比如String s->那么我只能调用string类里面的成员方法

      2. 第二个到最后的所有参数都必须一致（为空，则表示需要调用无参函数），且返回值相同

      3. **本质**：相当于你传入的第一个参数，去调用了他那个类的某个方法，然后传入后面的所有参数

      4. ```JAVA
          ArrayList<String> arrayList = new ArrayList<>();
                 Collections.addAll(arrayList, "zhangsan", "zhaosi", "wnagwu");
                 //全部大写
                 arrayList.stream().map(String::toUpperCase).forEach(s -> System.out.println(s));
            
                 }
         ```

5. 引用数组的构造方法

   1. ```java
      toarrays(int[]::new)直接返回一个int类型的数组
      ```

      

## 使用场景

* **在 Stream API 中**：在 `map`、`filter`、`forEach` 等方法中



***



# 异常

## Java的异常体系

* 主要基于两大类：Throwable类及其子类。

  * Error和Exception

    1. Error（错误）：表示运行时环境的错误。错误是程序无法处理的严重问题，如系统崩溃、虚拟机错误、动态链接失败等。通常，程序不应该尝试捕获这类错误。例如，OutOfMemoryError、StackOverflowError等。

    2. **Exception**（异常）：表示程序本身可以处理的异常条件。

       1.  编译时：这类异常在编译时期就必须被捕获或者声明抛出。它们通常是外部错误，如文件不存在（FileNotFoundException）、类未找到（ClassNotFoundException）等。非运行时异常强制程序员处理这些可能出现的问题，增强了程序的健壮性。

       
2. 运行时异常：这类异常包括运行时异常**（RuntimeException）**和错误（Error）。运行时异常由程序错误导致，如空指针访问（NullPointerException）、数组越界（ArrayIndexOutOfBoundsException）等。运行时异常是不需要在编译时强制捕获或声明的。

## 异常处理策略

1. jvm

   1. 输出异常的名称，原因，位置，打印在控制台，结束所有程序

2. **try->catch->finally语句**

   1. try语句中书写可能会遇上异常的语句

   2. 如果遇上异常，会新建这个异常的对象，并抛出

   3. 接着去catch语句里面寻找对应的对象，找到之后就会执行catch语句的内容，最后去执行try -catch之外的语句

   4. **`finally` 块是可选的，它通常与 `try-catch` 块一起使用。无论 `try` 块中是否抛出异常，`finally` 块中的代码都会被执**行。**

      1. ### try{return “a”} fianlly{return “b”}这条语句返回啥

         1. **finally块中的return语句会覆盖try块中的return返回**，因此，该语句将返回"b"

   * try没有遇上问题怎么办

     * 那么try-catch语句没用

   * try遇上多个问题怎么办

     * 在第一个遇到的异常就去找catch，后面try里面所有的语句报废

   * try的异常没有被捕获怎么办

     * 给虚拟机处理

     

     3. 抛出（主要用于结束方法）
        1. throws和throw
           1. throws写在方法旁边用于提示可能会抛出的异常（编译型必写，运行型选写）
           2. throw关键字在用时需要new一个异常出来，作为方法的返回值
 ## 自定义异常

 * 异常也不过是个对象，超级父类throwable中包含了三个方法
       * getmessage：给出异常的名称
       * tostring：给出异常的名称和getmessage
       * printstacktrace：最红的报错->可以用**system.err.printlf打印**
     * 还包含一个成员：detilmessage，有参构造方法（string message）this.message=message
     * **创造异常时只需要写有参构造，无参构造即可（调用父类有参构造**

***

# file

## 创建方法

直接利用**三种有参构造**

1. 全字符
2. 父字符+子字符
3. file+字符

```java
String parent="C:\\Users\\28796\\Desktop";
        File f1=new File(parent);
        System.out.println(f1);//全字符
        
        String son="picture.7z";
        File f2=new File(parent,son);//父子字符
        
        System.out.println(f2);
        File f3=new File(f1,son);//file+字符
        System.out.println(f3);
```

## 判断，获取方法

* 判断

  * exists->判断是不是存在
  * isfile->判断你是不是文件
  * isdiretory->判断是不是文件夹

* 获取

  * 路径

    * getabsoutlytpath->获取绝对路径
    * getpath->创建时的路径
    * getparent->父亲的路径
    * getparpaentfile->以文件的形式获得父亲路径

  * 名字

    * getname->文件名

  * 长度 

    * getlength->**long**形式返回字节

  * 最后修改日期

    * ```java
      lastmodified->long字节
      ```

* 创建
  * `public boolean createNewFile()` ：当且仅当具有该名称的文件尚**不存在**时，创建一个新的空文件。 
    * 当前路径
      * 不存在->创建成功
      * 存在->失败
    * 父级路径不存在->ioexception
  * `public boolean mkdir()` ：**创建单极文件**
    * 路径唯一->如果存在这个路径无法创立文件
  * `public boolean mkdirs()` ：**创建多级文件夹**

   * 删除
     * `public boolean delete()` ：**删除**由此File表示的文件或目录。  
       * 不走回收站
       * 只能删除文件或者空的文件夹

## 遍历（文件夹）

- `public String[] list()` ：返回一个String数组，表示该File目录中的所有子文件或目录。
- `public File[] listFiles()` ：返回一个File数组，表示该File目录中的所有的子文件或目录。  
  - 路径有问题：
    - 路径不存在/路径是文件->null
  - 文件夹有问题：
    - 空的->数组为0长度

```JAVA
 File file=new File("C:\\Users\\28796\\Desktop\\66");
        File[]arr=file.listFiles();//这个数组记录着我这66文件夹下所有的路径名字
        for(File s:arr)
        {
            System.out.println(s);
        }
```

### 过滤操作（寻找指定的对象/文件）

1. `String[]str=file.list(new FilenameFilter()`)->**过滤操作，返回字符数组**

   1. ```java
      String[]str=file.list(new FilenameFilter() {
                  @Override
                  public boolean accept(File dir, String name) 
                  {   //dir是父路径，name是子级文件名
                      File temp=new File(dir,name);
                      return temp.isFile()&&temp.getName().endsWith(".jpg");
                  }//要求留下文件且后缀是xx的文件
              });
              for (String s : str) {
                  System.out.println(s);
              }
      ```

2. `file.listFiles()`其中也包括FilenameFilter->分两层和FileFilter->分一层的重载

**名称为list的返回string，名称为listfile的返回file**->并且全都是**数组**

## 检查盘符

```java
public static  void AllCheck(File file)
{
    if(file.isFile()&&file.getName().endsWith(".mp4"))
    {
        System.out.println(file.getAbsoluteFile());
        return;
    }

    if(file.isDirectory())
    {
        //遍历它
        File[]arr=file.listFiles();
        if(arr!=null) {
            for (File file1 : arr) {
                AllCheck(file1);
            }
        }
    }
```







```
字节输出流的细节：
    1.创建字节输出流对象
          细节1：参数是字符串表示的路径或者是File对象都是可以的
          细节2：如果文件不存在会创建一个新的文件，但是要保证父级路径是存在的。
          细节3：如果文件已经存在，则会清空文件
    2.写数据
          细节：write方法的参数是整数，但是实际上写到本地文件中的是整数在ASCII上对应的字符
          ‘9’
          ‘7’
    3.释放资源
          每次使用完流之后都要释放资源
```

```
/*
   void write(int b)                       一次写一个字节数据
   void write(byte[] b)                    一次写一个字节数组数据
   void write(byte[] b, int off, int len)  一次写一个字节数组的部分数据
   参数一：
        数组
   参数二：
        起始索引  0
   参数三：
        个数      3
*/
```







```
/*
    换行写：
        再次写出一个换行符就可以了
        windows： \r\n
        Linux:    \n
        Mac:      \r
    细节：
        在windows操作系统当中，java对回车换行进行了优化。
        虽然完整的是\r\n，但是我们写其中一个\r或者\n，
        java也可以实现换行，因为java在底层会补全。
    建议：
        不要省略，还是写全了。


    续写：
        如果想要续写，打开续写开关即可
        开关位置：创建对象的第二个参数
        默认false：表示关闭续写，此时创建对象会清空文件
        手动传递true：表示打开续写，此时创建对象不会清空文件

*/


//1.创建对象
FileOutputStream fos = new FileOutputStream("myio\\a.txt",true);
//2.写出数据
String str = "kankelaoyezuishuai";
byte[] bytes1 = str.getBytes();
fos.write(bytes1);
```



```
/*
 * 演示：字节输入流FileInputStream
 * 实现需求：读取文件中的数据。（暂时不写中文）
 *   System.out.println(b6);//-1读不到就是-1
 * System.out.println((char)b1);强转
 * 实现步骤：
 *       创建对象
 *       读取数据
 *       释放资源
 * */
```



```
/* *//*
 *
 * read :表示读取数据，而且是读取一个数据就移动一次指针
 *
 * *//*
 FileInputStream fis = new FileInputStream("myio\\a.txt");
 //2.循环读取
 while ((fis.read()) != -1) {
     System.out.println(fis.read());//98  100  -1
 }
 //3.释放资源
 fis.close();*/
```



```
//1.创建对象
FileInputStream fis = new FileInputStream("D:\\itheima\\movie.mp4");
FileOutputStream fos = new FileOutputStream("myio\\copy.mp4");
//2.拷贝
//核心思想：边读边写
int b;
while((b = fis.read()) != -1){
    fos.write(b);
}
//3.释放资源
//规则：先开的最后关闭
fos.close();
fis.close();
```



```
/*
    public int read(byte[] buffer)      一次读一个字节数组数据
    //返回值len是表示读取多少个字节
    //然后读取的数据会被填充到byte数组之中，有覆盖机制
    //打印的时候，我们可以把byte转换成string（bytes）直接全部转换
    //也可以string（bytes，起始索引0，需要转换的数据量len），先把这些字节转换为char再拼接成string
*/
```

```
*
 *
 *    JDK7:IO流中捕获异常的写法
 *
 *      try后面的小括号中写创建对象的代码，
 *          注意：只有实现了AutoCloseable接口的类，才能在小括号中创建对象。
 *     try(){
 *
 *     }catch(){
 *
 *     }
 *
 * */


try (FileInputStream fis = new FileInputStream("D:\\itheima\\movie.mp4");
     FileOutputStream fos = new FileOutputStream("myio\\copy.mp4")) {
    //2.拷贝
    int len;
    byte[] bytes = new byte[1024 * 1024 * 5];
    while ((len = fis.read(bytes)) != -1) {
        fos.write(bytes, 0, len);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

随用随创建，用完就关

可以使用文档当计数器

***

# 多线程

1. 对于mythread对象继承thread类
   1. 使用时创立两个对象，对象在堆里面，使用共享数据要么静态，要么从外面传给对象
2. 使用myrunable方式
   1. 在类里面定义的变量共享，不用静态，因为栈可以直接去堆里面找
   2. 启动线程之后进入线程栈，在线程栈的数据单独享用
3. mycallable方法
   1. 定义一个mycallable类，类的共享结果与myrunalbe一样
   2. 但是几个线程就需要开几个不同的futuretask管理

我也不知道为什么runable可以直接用线程管理，但是callable就需要多开容器不能再线程直接管理
