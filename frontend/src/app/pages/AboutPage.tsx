import { Target, Users, Award, TrendingUp, Leaf, Globe } from "lucide-react";
import { Card } from "../components/ui/card";

export function AboutPage() {
  const mission = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To empower farmers with cutting-edge AI technology for early disease detection and prevention, ensuring food security and sustainable agriculture.",
      color: "bg-green-600"
    },
    {
      icon: TrendingUp,
      title: "Our Vision",
      description: "A world where every farmer has access to intelligent agricultural advisory systems, reducing crop losses and improving yields through technology.",
      color: "bg-blue-600"
    },
    {
      icon: Leaf,
      title: "Our Values",
      description: "Innovation, accessibility, sustainability, and farmer-first approach guide everything we do in agricultural technology development.",
      color: "bg-emerald-600"
    }
  ];

  const team = [
    {
      name: "Dr. Rajesh Kumar",
      role: "Chief Agricultural Scientist",
      expertise: "Plant Pathology, Rice Disease Research",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
    },
    {
      name: "Priya Sharma",
      role: "AI/ML Lead",
      expertise: "Computer Vision, Deep Learning",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    },
    {
      name: "Amit Verma",
      role: "Field Operations Director",
      expertise: "Agricultural Extension, Farmer Training",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
    },
    {
      name: "Dr. Sunita Patel",
      role: "Research Coordinator",
      expertise: "Climate Science, Crop Management",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
    }
  ];

  const stats = [
    { number: "50,000+", label: "Farmers Served" },
    { number: "94.2%", label: "Detection Accuracy" },
    { number: "12", label: "Disease Types" },
    { number: "15+", label: "States Covered" }
  ];

  const partners = [
    "International Rice Research Institute (IRRI)",
    "Indian Council of Agricultural Research (ICAR)",
    "National Rice Research Institute (NRRI)",
    "State Agricultural Universities",
    "Farmer Producer Organizations (FPOs)",
    "Krishi Vigyan Kendras (KVKs)"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-800 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl mb-6">About DeepLeaf</h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Pioneering the future of rice cultivation through artificial intelligence 
            and agricultural expertise
          </p>
        </div>
      </div>

      {/* Mission, Vision, Values */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mission.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-green-200">
                <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl text-green-400 mb-2">{stat.number}</div>
                <div className="text-green-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl text-green-900 mb-6 text-center">Our Story</h2>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <p>
              DeepLeaf was born from a simple observation: rice farmers across India were losing 
              significant portions of their harvest to diseases that could have been prevented with 
              early detection and proper intervention.
            </p>
            <p>
              In 2023, a team of agricultural scientists, AI researchers, and passionate technologists 
              came together with a shared mission—to make advanced disease detection accessible to 
              every farmer, regardless of their resources or location.
            </p>
            <p>
              Today, DeepLeaf serves over 50,000 farmers across 15 states, providing real-time 
              disease detection, personalized treatment recommendations, and continuous support through 
              our multilingual platform. Our AI models have been trained on millions of rice leaf images 
              and validated by leading agricultural research institutions.
            </p>
            <p>
              We believe that technology should serve those who feed the nation. Every feature we build, 
              every model we train, and every recommendation we provide is designed with the farmer at 
              the center.
            </p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-green-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Expert agricultural scientists, AI researchers, and field specialists working together 
              to revolutionize rice farming
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow border-green-200">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-green-100">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-green-600 mb-2">{member.role}</p>
                <p className="text-xs text-gray-500">{member.expertise}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Partners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Globe className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl text-green-900 mb-4">Our Partners & Collaborators</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Working together with leading agricultural research institutions and farmer organizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner, index) => (
            <Card key={index} className="p-4 text-center border-green-200 hover:border-green-400 transition-colors">
              <p className="text-gray-700">{partner}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4">Join Us in Our Mission</h2>
          <p className="text-xl text-green-100 mb-8">
            Whether you're a farmer, researcher, or agricultural enthusiast, 
            there's a place for you in our community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-700 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors">
              Become a Partner
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Join Our Research
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}